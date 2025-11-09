/**
 * Translation Logger
 * Logs missing translations for review
 */

import { prisma } from "@/lib/db/prisma";

interface MissingTranslationLog {
  templateId: string;
  languageCode: string;
  translationKey: string;
  blockId: string;
}

/**
 * Log missing translation
 */
export async function logMissingTranslation(
  templateId: string,
  languageCode: string,
  translationKey: string,
  blockId: string
) {
  try {
    // Check if translation exists but is pending
    const existing = await prisma.translation.findUnique({
      where: {
        templateId_languageCode_blockId_translationKey: {
          templateId,
          languageCode: languageCode.toLowerCase(),
          blockId,
          translationKey,
        },
      },
    });

    // Only log if translation doesn't exist or is pending
    if (!existing || existing.status === "PENDING") {
      // For now, we'll just ensure the translation record exists
      // In a production system, you might want to:
      // - Create a separate MissingTranslationLog table
      // - Send notifications to translators
      // - Track in analytics
      
      if (!existing) {
        // Create pending translation record
        await prisma.translation.create({
          data: {
            templateId,
            languageCode: languageCode.toLowerCase(),
            blockId,
            translationKey,
            translatedText: "", // Empty means missing
            status: "PENDING",
          },
        });
      }
    }
  } catch (error) {
    console.error("Error logging missing translation:", error);
    // Don't throw - logging shouldn't break the rendering
  }
}

/**
 * Get missing translations for a template
 */
export async function getMissingTranslations(
  templateId: string,
  languageCode: string
) {
  try {
    const missing = await prisma.translation.findMany({
      where: {
        templateId,
        languageCode: languageCode.toLowerCase(),
        OR: [
          { status: "PENDING" },
          { translatedText: "" },
        ],
      },
    });

    return missing;
  } catch (error) {
    console.error("Error getting missing translations:", error);
    return [];
  }
}

