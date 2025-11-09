"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { isLanguageActive } from "@/lib/templates/language-columns";
import { saveTemplateLanguage, getAllTemplateLanguages, getTemplateLanguage } from "@/lib/templates/template-language-helpers";

// Validation schemas
const templateStructureSchema = z.any(); // Email builder structure format

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  structure: templateStructureSchema.optional(),
  organizationId: z.string().optional(),
  defaultLanguage: z.string().default("en"),
});

// Ensure defaultLanguage is always "en" if not provided
const ensureDefaultLanguage = (lang?: string): string => {
  return lang || "en";
};

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  structure: templateStructureSchema.optional(),
  defaultLanguage: z.string().optional(),
});

export async function createTemplate(data: z.infer<typeof createTemplateSchema>) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization through OrganizationMember
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const validated = createTemplateSchema.parse(data);
    const { structure, ...templateData } = validated; // Extract structure to save separately
    const defaultLang = ensureDefaultLanguage(templateData.defaultLanguage);

    // Validate that default language is enabled
    const { isLanguageActive } = await import("@/lib/templates/language-columns");
    const languageIsActive = await isLanguageActive(defaultLang);
    if (!languageIsActive) {
      return { error: `Default language ${defaultLang} is not enabled. Please enable it in Language Settings first.` };
    }

    // Create template (structure will be stored in TemplateLanguage table)
    // Set structure to null since we're using TemplateLanguage table now
    const template = await prisma.template.create({
      data: {
        name: templateData.name,
        description: templateData.description || undefined,
        // structure field removed - using TemplateLanguage table instead
        defaultLanguage: defaultLang,
        organizationId: orgMember.organization.id,
        createdBy: user.id,
      } as any, // Type assertion to bypass structure field type check
    });

    // Save initial structure to TemplateLanguage table
    if (structure) {
      await saveTemplateLanguage(template.id, defaultLang, structure);
    }

    // Create initial version - get structure from TemplateLanguage table
    const initialStructures = await getAllTemplateLanguages(template.id);
    await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        structure: initialStructures,
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/templates");
    return { success: true, template };
  } catch (error) {
    console.error("Create template error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to create template" };
  }
}

export async function saveTemplate(id: string, structure: any, language?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Validate id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return { error: "Invalid template ID" };
    }

    const templateId = id.trim();
    const lang = ensureDefaultLanguage(language);

    // Check if language is active/enabled
    const languageIsActive = await isLanguageActive(lang);
    if (!languageIsActive) {
      return { error: `Language ${lang} is not enabled. Please enable it in Language Settings first.` };
    }

    // Verify user has access to this template through OrganizationMember
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    // Get the old structure for this language (for versioning check)
    const oldLangStructure = await getTemplateLanguage(templateId, lang);

    console.log(`[saveTemplate] Saving language: ${lang} to TemplateLanguage table`);
    
    // Deep copy the structure to prevent reference sharing
    const structureToSave = JSON.parse(JSON.stringify(structure));
    
    // Save to TemplateLanguage table
    await saveTemplateLanguage(templateId, lang, structureToSave);
      
    // Update template's updatedAt timestamp
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        updatedAt: new Date(),
      },
    });
    
    console.log(`[saveTemplate] Successfully saved ${lang} structure to TemplateLanguage table`);

    // Check if we need to create a new version
    const shouldVersion = oldLangStructure ? JSON.stringify(oldLangStructure) !== JSON.stringify(structure) : true;

    if (shouldVersion) {
      // Get latest version number
      const latestVersion = await prisma.templateVersion.findFirst({
        where: { templateId: templateId },
        orderBy: { versionNumber: "desc" },
      });

      const nextVersion = (latestVersion?.versionNumber || 0) + 1;

      // Get all structures for versioning from TemplateLanguage table
      const allStructures = await getAllTemplateLanguages(templateId);

      // Create new version
      await prisma.templateVersion.create({
        data: {
          templateId: templateId,
          versionNumber: nextVersion,
          structure: allStructures,
          createdBy: user.id,
          notes: `Auto-saved version (${lang})`,
        },
      });
    }

    revalidatePath(`/dashboard/templates/${id}/edit`);
    return { success: true, template: updatedTemplate };
  } catch (error) {
    console.error("Save template error:", error);
    return { error: "Failed to save template" };
  }
}

export async function getTemplateById(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const template = await prisma.template.findFirst({
      where: {
        id,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 5,
          include: {
            creator: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    return { success: true, template };
  } catch (error) {
    console.error("Get template error:", error);
    return { error: "Failed to get template" };
  }
}

export async function getTemplates(filters?: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization through OrganizationMember
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { templates: [], total: 0, page: 1, limit: 10 };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: orgMember.organization.id,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Note: Template model doesn't have category field in schema
    // if (filters?.category) {
    //   where.category = filters.category;
    // }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.template.count({ where }),
    ]);

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get templates error:", error);
    return { templates: [], total: 0, page: 1, limit: 10 };
  }
}

export async function updateTemplate(
  id: string,
  data: z.infer<typeof updateTemplateSchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access through OrganizationMember
    const template = await prisma.template.findFirst({
      where: {
        id,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    const validated = updateTemplateSchema.parse(data);

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        ...validated,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/templates");
    revalidatePath(`/dashboard/templates/${id}/edit`);
    return { success: true, template: updatedTemplate };
  } catch (error) {
    console.error("Update template error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors.map((e) => e.message).join(", ") };
    }
    return { error: "Failed to update template" };
  }
}

export async function deleteTemplate(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access through OrganizationMember
    const template = await prisma.template.findFirst({
      where: {
        id,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        campaigns: {
          where: {
            status: { in: ["DRAFT", "SCHEDULED", "SENDING"] },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    // Check if used in active campaigns
    if (template.campaigns.length > 0) {
      return {
        error: `Template is used in ${template.campaigns.length} active campaign(s). Please remove it from campaigns first.`,
      };
    }

    // Delete template (hard delete since no deletedAt field)
    await prisma.template.delete({
      where: { id },
    });

    revalidatePath("/dashboard/templates");
    return { success: true };
  } catch (error) {
    console.error("Delete template error:", error);
    return { error: "Failed to delete template" };
  }
}

export async function duplicateTemplate(id: string, newLanguage?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get original template through OrganizationMember
    const originalTemplate = await prisma.template.findFirst({
      where: {
        id,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!originalTemplate) {
      return { error: "Template not found or access denied" };
    }

    // Create duplicate with optional language change
    const newName = newLanguage && newLanguage !== originalTemplate.defaultLanguage
      ? `${originalTemplate.name} (${newLanguage.toUpperCase()})`
      : `${originalTemplate.name} (Copy)`;

    const duplicatedTemplate = await prisma.template.create({
      data: {
        name: newName,
        description: originalTemplate.description || undefined,
        // structure field removed - using TemplateLanguage table instead
        defaultLanguage: newLanguage || originalTemplate.defaultLanguage,
        organizationId: originalTemplate.organizationId,
        createdBy: user.id,
      } as any, // Type assertion to bypass structure field type check
    });

      // Duplicate latest version
      const latestVersion = await prisma.templateVersion.findFirst({
        where: { templateId: id },
        orderBy: { versionNumber: "desc" },
      });

    if (latestVersion) {
      await prisma.templateVersion.create({
        data: {
          templateId: duplicatedTemplate.id,
          versionNumber: 1,
          structure: latestVersion.structure as any,
          createdBy: user.id,
          notes: `Duplicated from template ${originalTemplate.name}`,
        },
      });
    }

    revalidatePath("/dashboard/templates");
    return { success: true, template: duplicatedTemplate };
  } catch (error) {
    console.error("Duplicate template error:", error);
    return { error: "Failed to duplicate template" };
  }
}

