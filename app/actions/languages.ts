"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const createLanguageSchema = z.object({
  code: z.string().length(2, "Language code must be 2 characters (ISO 639-1)").toLowerCase(),
  name: z.string().min(1, "Name is required").max(100),
  isActive: z.boolean().default(false),
});

const updateLanguageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Get all languages
 */
export async function getLanguages() {
  try {
    const languages = await prisma.language.findMany({
      orderBy: {
        name: "asc", // Order alphabetically by name
      },
    });

    return { success: true, languages };
  } catch (error) {
    console.error("Get languages error:", error);
    return { error: "Failed to get languages" };
  }
}

/**
 * Create a new language (Admin only)
 */
export async function createLanguage(data: z.infer<typeof createLanguageSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check if user is admin/owner
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!orgMember) {
      return { error: "Insufficient permissions. Admin access required." };
    }

    const validated = createLanguageSchema.parse(data);

    // Check if language already exists
    const existing = await prisma.language.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return { error: "Language with this code already exists" };
    }

    const language = await prisma.language.create({
      data: {
        code: validated.code.toLowerCase(),
        name: validated.name,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/settings/languages");
    return { success: true, language };
  } catch (error) {
    console.error("Create language error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create language" };
  }
}

/**
 * Update a language
 */
export async function updateLanguage(
  code: string,
  data: z.infer<typeof updateLanguageSchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check if user is admin/owner
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!orgMember) {
      return { error: "Insufficient permissions. Admin access required." };
    }

    const validated = updateLanguageSchema.parse(data);

    const language = await prisma.language.update({
      where: { code: code.toLowerCase() },
      data: validated,
    });

    revalidatePath("/settings/languages");
    return { success: true, language };
  } catch (error) {
    console.error("Update language error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update language" };
  }
}

/**
 * Toggle language active status
 */
export async function toggleLanguageStatus(code: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Check if user is admin/owner
    const orgMember = await prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!orgMember) {
      return { error: "Insufficient permissions. Admin access required." };
    }

    const language = await prisma.language.findUnique({
      where: { code: code.toLowerCase() },
    });

    if (!language) {
      return { error: "Language not found" };
    }

    const updated = await prisma.language.update({
      where: { code: code.toLowerCase() },
      data: {
        isActive: !language.isActive,
      },
    });

    revalidatePath("/settings/languages");
    return { success: true, language: updated, isActive: updated.isActive };
  } catch (error) {
    console.error("Toggle language status error:", error);
    return { error: "Failed to toggle language status" };
  }
}

/**
 * Set default language for organization
 */
export async function setDefaultLanguage(code: string) {
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
      return { error: "User organization not found" };
    }

    // Check if user has permission (OWNER, ADMIN, EDITOR)
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions" };
    }

    // Verify language exists and is active
    const language = await prisma.language.findUnique({
      where: { code: code.toLowerCase() },
    });

    if (!language) {
      return { error: "Language not found" };
    }

    if (!language.isActive) {
      return { error: "Cannot set inactive language as default" };
    }

    // Update organization's default language
    await prisma.organization.update({
      where: { id: orgMember.organization.id },
      data: {
        defaultLanguage: code.toLowerCase(),
      },
    });

    // Also update all existing templates' default language for consistency
    await prisma.template.updateMany({
      where: {
        organizationId: orgMember.organization.id,
      },
      data: {
        defaultLanguage: code.toLowerCase(),
      },
    });

    revalidatePath("/settings/languages");
    revalidatePath("/dashboard/templates");
    return { success: true, defaultLanguage: code.toLowerCase() };
  } catch (error) {
    console.error("Set default language error:", error);
    return { error: "Failed to set default language" };
  }
}

/**
 * Get default language for organization
 */
export async function getDefaultLanguage() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
              select: {
                defaultLanguage: true,
          },
        },
      },
    });

    if (!orgMember?.organization) {
      return { success: true, defaultLanguage: "en" }; // Default fallback
    }

    // Get default language from organization
    const defaultLanguage = orgMember.organization.defaultLanguage || "en";

    return { success: true, defaultLanguage };
  } catch (error) {
    console.error("Get default language error:", error);
    return { success: true, defaultLanguage: "en" };
  }
}

