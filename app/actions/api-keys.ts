"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { generateApiKey, hashApiKey } from "@/lib/auth/api-keys";
import { requirePermission } from "@/lib/auth/permissions";
import { logAuditAction } from "@/lib/audit/audit-logger";
import { headers } from "next/headers";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  permissions: z.array(z.string()).default([]),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Empty string is valid (no expiration)
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid datetime format" }
    ),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true; // Empty string is valid (no expiration)
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Invalid datetime format" }
    ),
});

/**
 * Create a new API key
 */
export async function createApiKey(data: z.infer<typeof createApiKeySchema>) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (OWNER, ADMIN can create API keys)
    requirePermission(orgMember.role, "api_keys.create");

    // Validate input
    const validated = createApiKeySchema.parse(data);

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);

    // Convert expiresAt string to Date if provided
    let expiresAtDate: Date | null = null;
    if (validated.expiresAt && validated.expiresAt.trim() !== "") {
      expiresAtDate = new Date(validated.expiresAt);
      // Validate the date is in the future
      if (isNaN(expiresAtDate.getTime())) {
        return { error: "Invalid expiration date" };
      }
    }

    // Create API key record
    const createdKey = await prisma.aPIKey.create({
      data: {
        organizationId: orgMember.organization.id,
        name: validated.name,
        keyHash,
        permissions: validated.permissions || [],
        expiresAt: expiresAtDate,
      },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "CREATE",
      resource: "API_KEY",
      resourceId: createdKey.id,
      details: { name: validated.name },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/api-keys");
    
    // Return the plain API key only once (for display to user)
    return {
      success: true,
      apiKey: {
        id: createdKey.id,
        name: createdKey.name,
        key: apiKey, // Only returned once on creation
        permissions: createdKey.permissions,
        createdAt: createdKey.createdAt,
        expiresAt: createdKey.expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") };
    }
    if (error instanceof Error && error.message.includes("Permission denied")) {
      return { error: error.message };
    }
    console.error("Create API key error:", error);
    return { error: "Failed to create API key" };
  }
}

/**
 * Get all API keys for the organization
 */
export async function getApiKeys() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Get all API keys for the organization
    const apiKeys = await prisma.aPIKey.findMany({
      where: {
        organizationId: orgMember.organization.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      apiKeys: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        isExpired: key.expiresAt ? new Date(key.expiresAt) < new Date() : false,
      })),
    };
  } catch (error) {
    console.error("Get API keys error:", error);
    return { error: "Failed to get API keys" };
  }
}

/**
 * Update an API key
 */
export async function updateApiKey(
  id: string,
  data: z.infer<typeof updateApiKeySchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    requirePermission(orgMember.role, "api_keys.edit");

    // Verify API key exists and belongs to organization
    const existingKey = await prisma.aPIKey.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!existingKey) {
      return { error: "API key not found" };
    }

    // Validate input
    const validated = updateApiKeySchema.parse(data);

    // Convert expiresAt string to Date if provided
    let expiresAtDate: Date | null | undefined = undefined;
    if (validated.expiresAt !== undefined) {
      if (validated.expiresAt && validated.expiresAt.trim() !== "") {
        expiresAtDate = new Date(validated.expiresAt);
        // Validate the date is valid
        if (isNaN(expiresAtDate.getTime())) {
          return { error: "Invalid expiration date" };
        }
      } else {
        expiresAtDate = null; // Explicitly set to null for no expiration
      }
    }

    // Update API key
    const updatedKey = await prisma.aPIKey.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.permissions !== undefined && { permissions: validated.permissions }),
        ...(expiresAtDate !== undefined && { expiresAt: expiresAtDate }),
      },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "UPDATE",
      resource: "API_KEY",
      resourceId: id,
      details: validated,
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/api-keys");
    return { success: true, apiKey: updatedKey };
  } catch (error) {
    console.error("Update API key error:", error);
    if (error instanceof Error && error.message.includes("Permission denied")) {
      return { error: error.message };
    }
    return { error: "Failed to update API key" };
  }
}

/**
 * Revoke (delete) an API key
 */
export async function revokeApiKey(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    requirePermission(orgMember.role, "api_keys.delete");

    // Verify API key exists and belongs to organization
    const existingKey = await prisma.aPIKey.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!existingKey) {
      return { error: "API key not found" };
    }

    // Delete API key
    await prisma.aPIKey.delete({
      where: { id },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "DELETE",
      resource: "API_KEY",
      resourceId: id,
      details: { name: existingKey.name },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/api-keys");
    return { success: true };
  } catch (error) {
    console.error("Revoke API key error:", error);
    if (error instanceof Error && error.message.includes("Permission denied")) {
      return { error: error.message };
    }
    return { error: "Failed to revoke API key" };
  }
}

/**
 * Validate API key and get organization
 * Used by API routes for authentication
 */
export async function validateApiKey(apiKey: string) {
  try {
    if (!apiKey || !apiKey.startsWith("mc_")) {
      return { error: "Invalid API key format" };
    }

    // Find API key by hash
    const allKeys = await prisma.aPIKey.findMany({
      include: {
        organization: true,
      },
    });

    // Check each key (we need to verify the hash)
    for (const key of allKeys) {
      const { verifyApiKey: verify } = await import("@/lib/auth/api-keys");
      const isValid = await verify(apiKey, key.keyHash);
      
      if (isValid) {
        // Check if expired
        if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
          return { error: "API key has expired" };
        }

        // Update last used timestamp
        await prisma.aPIKey.update({
          where: { id: key.id },
          data: { lastUsedAt: new Date() },
        });

        return {
          success: true,
          organizationId: key.organizationId,
          permissions: key.permissions,
        };
      }
    }

    return { error: "Invalid API key" };
  } catch (error) {
    console.error("Validate API key error:", error);
    return { error: "Failed to validate API key" };
  }
}

