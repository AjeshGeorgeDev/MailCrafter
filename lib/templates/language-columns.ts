/**
 * Language Structure Management
 * Handles language-keyed JSON structures for templates
 */

/**
 * Get active languages from database
 */
export async function getActiveLanguages(): Promise<string[]> {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const languages = await prisma.language.findMany({
      where: { isActive: true },
      select: { code: true },
    });
    return languages.map(l => l.code.toLowerCase());
  } catch (error) {
    console.error("Error getting active languages:", error);
    // Fallback to default languages
    return ["en"];
  }
}

/**
 * Check if a language is active/enabled
 */
export async function isLanguageActive(language: string): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const lang = await prisma.language.findUnique({
      where: { code: language.toLowerCase() },
      select: { isActive: true },
    });
    return lang?.isActive ?? false;
  } catch (error) {
    console.error("Error checking language status:", error);
    return false;
  }
}

/**
 * Build allStructures object from template structure JSON
 * This converts the JSON structure to the object format expected by the UI
 */
export function buildAllStructuresFromJson(template: any): Record<string, any> {
  const allStructures: Record<string, any> = {};
  
  // Check if structure exists and is in language format
  if (template.structure && typeof template.structure === 'object' && !Array.isArray(template.structure)) {
    // Check if it's already in language format { "en": {...}, "fr": {...} }
    if (!template.structure.childrenIds) {
      // Language-keyed format - deep copy
      for (const [lang, structure] of Object.entries(template.structure)) {
        if (structure !== null && structure !== undefined) {
          allStructures[lang] = JSON.parse(JSON.stringify(structure));
        }
      }
    } else {
      // Old format - single structure, assign to default language
      const defaultLang = template.defaultLanguage || "en";
      allStructures[defaultLang] = JSON.parse(JSON.stringify(template.structure));
    }
  }
  
  // If no structures found, return empty object
  return allStructures;
}

/**
 * Build update data for saving a specific language structure
 * Updates only the specified language in the JSON structure
 */
export function buildUpdateDataForLanguage(
  currentStructure: any,
  language: string,
  structure: any
): Record<string, any> {
  // Start with current structure or empty object
  const structuresByLanguage: Record<string, any> = currentStructure 
    ? JSON.parse(JSON.stringify(currentStructure))
    : {};
  
  // Ensure it's in language-keyed format (not single structure)
  if (structuresByLanguage.childrenIds) {
    // Convert old format to language format
    const defaultLang = "en";
    const converted: Record<string, any> = {};
    converted[defaultLang] = structuresByLanguage;
    Object.assign(structuresByLanguage, converted);
    delete structuresByLanguage.childrenIds;
    delete structuresByLanguage.backdropColor;
    delete structuresByLanguage.canvasColor;
    delete structuresByLanguage.textColor;
    delete structuresByLanguage.fontFamily;
  }
  
  // Update only the target language with deep copy
  structuresByLanguage[language.toLowerCase()] = JSON.parse(JSON.stringify(structure));
  
  return {
    structure: structuresByLanguage,
  };
}

