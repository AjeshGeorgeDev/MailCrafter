/**
 * Translation Loader
 * Loads and caches translations from database
 */

import { prisma } from "@/lib/db/prisma";

interface TranslationCache {
  [templateId: string]: {
    [languageCode: string]: {
      translations: Map<string, string>;
      timestamp: number;
    };
  };
}

// In-memory cache (could be replaced with Redis in production)
const translationCache: TranslationCache = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Load translations for a template and language
 */
export async function loadTranslations(
  templateId: string,
  languageCode: string
): Promise<Map<string, string>> {
  // Check cache first
  const cached = getCachedTranslations(templateId, languageCode);
  if (cached) {
    return cached;
  }

  // Load from database
  const translations = await prisma.translation.findMany({
    where: {
      templateId,
      languageCode: languageCode.toLowerCase(),
      status: { in: ["TRANSLATED", "REVIEWED"] },
    },
    select: {
      translationKey: true,
      translatedText: true,
      blockId: true,
    },
  });

  // Build map: "blockId_translationKey" -> "translatedText"
  const translationMap = new Map<string, string>();
  translations.forEach((t) => {
    const key = `${t.blockId}_${t.translationKey}`;
    translationMap.set(key, t.translatedText);
  });

  // Cache the translations
  cacheTranslations(templateId, languageCode, translationMap);

  return translationMap;
}

/**
 * Get cached translations
 */
function getCachedTranslations(
  templateId: string,
  languageCode: string
): Map<string, string> | null {
  const cache = translationCache[templateId]?.[languageCode.toLowerCase()];
  if (!cache) {
    return null;
  }

  // Check if cache is still valid
  const now = Date.now();
  if (now - cache.timestamp > CACHE_TTL) {
    // Cache expired
    delete translationCache[templateId][languageCode.toLowerCase()];
    return null;
  }

  return cache.translations;
}

/**
 * Cache translations
 */
function cacheTranslations(
  templateId: string,
  languageCode: string,
  translations: Map<string, string>
) {
  if (!translationCache[templateId]) {
    translationCache[templateId] = {};
  }

  translationCache[templateId][languageCode.toLowerCase()] = {
    translations,
    timestamp: Date.now(),
  };
}

/**
 * Invalidate cache for a template
 */
export function invalidateTranslationCache(templateId: string, languageCode?: string) {
  if (languageCode) {
    // Invalidate specific language
    if (translationCache[templateId]?.[languageCode.toLowerCase()]) {
      delete translationCache[templateId][languageCode.toLowerCase()];
    }
  } else {
    // Invalidate all languages for this template
    delete translationCache[templateId];
  }
}

/**
 * Clear all translation cache
 */
export function clearTranslationCache() {
  Object.keys(translationCache).forEach((key) => {
    delete translationCache[key];
  });
}

