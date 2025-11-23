"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createUser, getUserByEmail, updateUser } from "@/lib/db/users";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenAsUsed,
} from "@/lib/db/password-reset";
import { sendEmail } from "@/lib/email/email-service";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function registerUser(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = registerSchema.parse(data);

    // Check if user already exists
    const existingUser = await getUserByEmail(validated.email);
    if (existingUser) {
      return {
        error: "User with this email already exists",
      };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validated.password);
    if (!passwordValidation.valid) {
      return {
        error: passwordValidation.errors.join(", "),
      };
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validated.password);
    const user = await createUser({
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: Role.VIEWER,
    });

    // Note: User will need to log in after registration
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    console.error("Registration error:", error);
    return {
      error: "An error occurred during registration",
    };
  }
}

export async function loginUser(formData: FormData) {
  try {
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const validated = loginSchema.parse(data);

    // Verification is done in auth.config.ts authorize function
    // This function just validates the form data
    // The actual login will happen via NextAuth on the client side
    
    return {
      success: true,
      email: validated.email,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    console.error("Login error:", error);
    return {
      error: "An error occurred during login",
    };
  }
}

/**
 * Get a system SMTP profile for sending system emails
 * Returns the first active SMTP profile found
 */
async function getSystemSMTPProfile() {
  const profile = await prisma.smtpProfile.findFirst({
    where: {
      isActive: true,
    },
    orderBy: [
      { isDefault: "desc" },
      { createdAt: "asc" },
    ],
  });

  return profile;
}

/**
 * Request password reset
 * Sends a password reset email to the user
 */
export async function requestPasswordReset(email: string) {
  try {
    // Validate email
    if (!email || typeof email !== "string") {
      return {
        error: "Email is required",
      };
    }

    const emailSchema = z.string().email("Invalid email address");
    let validatedEmail: string;
    try {
      validatedEmail = emailSchema.parse(email);
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        return {
          error: "Invalid email address",
        };
      }
      throw parseError;
    }

    // Find user by email
    const user = await getUserByEmail(validatedEmail);
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      // Return success even if user doesn't exist
      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      };
    }

    // Get system SMTP profile
    const smtpProfile = await getSystemSMTPProfile();
    if (!smtpProfile) {
      console.error("No SMTP profile configured for password reset emails");
      return {
        error: "Email service is not configured. Please contact support.",
      };
    }

    // Create reset token
    const token = await createPasswordResetToken(user.id);

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send reset email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Reset Your Password</h1>
            <p>Hello${user.name ? ` ${user.name}` : ""},</p>
            <p>We received a request to reset your password for your MailCrafter account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>This link will expire in 24 hours.</strong><br>
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} MailCrafter. All rights reserved.
          </p>
        </body>
      </html>
    `;

    const emailText = `
Reset Your Password

Hello${user.name ? ` ${user.name}` : ""},

We received a request to reset your password for your MailCrafter account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 24 hours.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} MailCrafter. All rights reserved.
    `;

    await sendEmail({
      smtpProfileId: smtpProfile.id,
      to: user.email,
      subject: "Reset Your MailCrafter Password",
      html: emailHtml,
      text: emailText,
      from: smtpProfile.fromEmail,
      fromName: smtpProfile.fromName || "MailCrafter",
    });

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    if (error instanceof z.ZodError) {
      return {
        error: error.errors.map((e) => e.message).join(", ") || "Invalid email address",
      };
    }
    return {
      error: "An error occurred while processing your request. Please try again later.",
    };
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Reset password using token
 */
export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
) {
  try {
    // Validate input
    let validated: z.infer<typeof resetPasswordSchema>;
    try {
      validated = resetPasswordSchema.parse({
        token,
        password,
        confirmPassword,
      });
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        return {
          error: parseError.errors.map((e) => e.message).join(", "),
        };
      }
      throw parseError;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validated.password);
    if (!passwordValidation.valid) {
      return {
        error: passwordValidation.errors.join(", "),
      };
    }

    // Get and validate token
    const tokenData = await getPasswordResetToken(validated.token);
    if (!tokenData) {
      return {
        error: "Invalid or expired reset token. Please request a new password reset.",
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(validated.password);

    // Update user password
    await updateUser(tokenData.userId, {
      password: hashedPassword,
    });

    // Mark token as used
    await markTokenAsUsed(validated.token);

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError && error.errors) {
      return {
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return {
      error: "An error occurred while resetting your password. Please try again.",
    };
  }
}

