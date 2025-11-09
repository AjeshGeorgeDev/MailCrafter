"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createUser, getUserByEmail } from "@/lib/db/users";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { Role } from "@prisma/client";

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

export async function requestPasswordReset(email: string) {
  // TODO: Implement password reset functionality
  // This will be implemented in a later phase
  return {
    error: "Password reset not yet implemented",
  };
}

export async function resetPassword(token: string, password: string) {
  // TODO: Implement password reset functionality
  // This will be implemented in a later phase
  return {
    error: "Password reset not yet implemented",
  };
}

