"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { extractTranslatableText } from "@/lib/translations/extractor";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";
import { invalidateTranslationCache } from "@/lib/translations/loader";
import { revalidatePath } from "next/cache";

const updateTranslationSchema = z.object({
  translationKey: z.string(),
  translatedText: z.string(),
  blockId: z.string(),
});

const bulkUpdateSchema = z.object({
  translations: z.array(updateTranslationSchema),
});

/**
 * Extract translatable text from template
 */
export async function extractTranslatableTextAction(templateId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get template
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

    // Extract translatable items
    const structure = template.structure as any;
    const document = structure as EmailBuilderDocument;
    const items = extractTranslatableText(document);

    // Store translation keys in database (create Translation records)
    // We'll create pending translations for all languages
    const languages = await prisma.language.findMany({
      where: { isActive: true },
    });

    for (const language of languages) {
      for (const item of items) {
        // Check if translation already exists
        const existing = await prisma.translation.findUnique({
          where: {
            templateId_languageCode_blockId_translationKey: {
              templateId,
              languageCode: language.code,
              blockId: item.blockId,
              translationKey: item.translationKey,
            },
          },
        });

        if (!existing) {
          await prisma.translation.create({
            data: {
              templateId,
              languageCode: language.code,
              blockId: item.blockId,
              translationKey: item.translationKey,
              translatedText: item.originalText, // Default to original
              status: language.code === (template.defaultLanguage || "en") ? "REVIEWED" : "PENDING",
            },
          });
        }
      }
    }

    return { success: true, items };
  } catch (error) {
    console.error("Extract translatable text error:", error);
    return { error: "Failed to extract translatable text" };
  }
}

/**
 * Get translations for a template and language
 */
export async function getTranslations(templateId: string, languageCode: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access
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

    // Get translations
    const translations = await prisma.translation.findMany({
      where: {
        templateId,
        languageCode: languageCode.toLowerCase(),
      },
      orderBy: {
        translationKey: "asc",
      },
    });

    // Get translatable items for context
    const structure = template.structure as any;
    const document = structure as EmailBuilderDocument;
    const items = extractTranslatableText(document);

    // Merge with translations
    const itemsWithTranslations = items.map((item) => {
      const translation = translations.find(
        (t) =>
          t.blockId === item.blockId && t.translationKey === item.translationKey
      );
      return {
        ...item,
        translatedText: translation?.translatedText || item.originalText,
        status: translation?.status || "PENDING",
        translationId: translation?.id,
      };
    });

    return { success: true, translations: itemsWithTranslations };
  } catch (error) {
    console.error("Get translations error:", error);
    return { error: "Failed to get translations" };
  }
}

/**
 * Update translations (bulk)
 */
export async function updateTranslations(
  templateId: string,
  languageCode: string,
  data: z.infer<typeof bulkUpdateSchema>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access
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

    const validated = bulkUpdateSchema.parse(data);

    // Update or create translations
    for (const translation of validated.translations) {
      await prisma.translation.upsert({
        where: {
          templateId_languageCode_blockId_translationKey: {
            templateId,
            languageCode: languageCode.toLowerCase(),
            blockId: translation.blockId,
            translationKey: translation.translationKey,
          },
        },
        update: {
          translatedText: translation.translatedText,
          status: "TRANSLATED",
          updatedAt: new Date(),
        },
        create: {
          templateId,
          languageCode: languageCode.toLowerCase(),
          blockId: translation.blockId,
          translationKey: translation.translationKey,
          translatedText: translation.translatedText,
          status: "TRANSLATED",
        },
      });
    }

    // Invalidate translation cache
    invalidateTranslationCache(templateId, languageCode.toLowerCase());
    
    revalidatePath(`/dashboard/templates/${templateId}`);
    return { success: true };
  } catch (error) {
    console.error("Update translations error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update translations" };
  }
}

/**
 * Get translation progress for a template
 */
export async function getTranslationProgress(templateId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access
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

    // Get total translatable items
    const structure = template.structure as any;
    const document = structure as EmailBuilderDocument;
    const items = extractTranslatableText(document);
    const totalItems = items.length;

    // Get all active languages
    const languages = await prisma.language.findMany({
      where: { isActive: true },
    });

    // Calculate progress for each language
    const progress = await Promise.all(
      languages.map(async (language) => {
        const translated = await prisma.translation.count({
          where: {
            templateId,
            languageCode: language.code,
            status: { in: ["TRANSLATED", "REVIEWED"] },
          },
        });

        const percentage = totalItems > 0 ? (translated / totalItems) * 100 : 0;

        return {
          languageCode: language.code,
          languageName: language.name,
          translated,
          total: totalItems,
          percentage: Math.round(percentage),
        };
      })
    );

    return { success: true, progress, totalItems };
  } catch (error) {
    console.error("Get translation progress error:", error);
    return { error: "Failed to get translation progress" };
  }
}

/**
 * Update single translation
 */
export async function updateSingleTranslation(
  templateId: string,
  languageCode: string,
  translationKey: string,
  blockId: string,
  translatedText: string,
  status?: "PENDING" | "TRANSLATED" | "REVIEWED"
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify access
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

    const translation = await prisma.translation.upsert({
      where: {
        templateId_languageCode_blockId_translationKey: {
          templateId,
          languageCode: languageCode.toLowerCase(),
          blockId,
          translationKey,
        },
      },
      update: {
        translatedText,
        status: status || "TRANSLATED",
        updatedAt: new Date(),
      },
      create: {
        templateId,
        languageCode: languageCode.toLowerCase(),
        blockId,
        translationKey,
        translatedText,
        status: status || "TRANSLATED",
      },
    });

    // Invalidate translation cache
    invalidateTranslationCache(templateId, languageCode.toLowerCase());
    
    revalidatePath(`/dashboard/templates/${templateId}`);
    return { success: true, translation };
  } catch (error) {
    console.error("Update single translation error:", error);
    return { error: "Failed to update translation" };
  }
}

