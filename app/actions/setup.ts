"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createUser } from "@/lib/db/users";
import { createOrganization } from "@/lib/db/organizations";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { Role } from "@prisma/client";

const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Check if setup is needed (no OWNER users exist)
 */
export async function isSetupNeeded() {
  try {
    const ownerCount = await prisma.user.count({
      where: {
        role: Role.OWNER,
      },
    });

    return { needsSetup: ownerCount === 0 };
  } catch (error) {
    console.error("Error checking setup status:", error);
    return { needsSetup: true }; // Default to needing setup on error
  }
}

/**
 * Create super admin and initial organization
 */
export async function setupSuperAdmin(data: z.infer<typeof setupSchema>) {
  try {
    // Validate input
    const validated = setupSchema.parse(data);

    // Check if setup is still needed (prevent race conditions)
    const { needsSetup } = await isSetupNeeded();
    if (!needsSetup) {
      return {
        error: "Setup has already been completed. Please log in instead.",
      };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return {
        error: "A user with this email already exists",
      };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(validated.password);
    if (!passwordValidation.valid) {
      return {
        error: passwordValidation.errors.join(", "),
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Create super admin user
    const admin = await createUser({
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: Role.OWNER,
    });

    // Mark email as verified for the super admin
    await prisma.user.update({
      where: { id: admin.id },
      data: { emailVerified: new Date() },
    });

    // Create initial organization with the admin as owner
    await createOrganization(
      {
        name: validated.organizationName,
      },
      admin.id
    );

    return {
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return {
        error: error.errors[0]?.message || "Validation error",
      };
    }
    console.error("Setup error:", error);
    return {
      error: error?.message || "Failed to complete setup",
    };
  }
}

