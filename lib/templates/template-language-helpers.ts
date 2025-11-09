/**
 * Template Language Helpers
 * Functions to work with the TemplateLanguage table for scalable language storage
 */

import { prisma } from "@/lib/db/prisma";

/**
 * Save template structure for a specific language
 */
export async function saveTemplateLanguage(
  templateId: string,
  languageCode: string,
  structure: any
): Promise<void> {
  const normalizedLangCode = languageCode.toLowerCase();
  const structureCopy = JSON.parse(JSON.stringify(structure)); // Deep copy
  
  // Validate structure has content
  const hasContent = structureCopy && (
    structureCopy.childrenIds?.length > 0 || 
    Object.keys(structureCopy).length > 5
  );
  
  // Count all blocks (excluding metadata keys)
  const allKeys = Object.keys(structureCopy);
  const blockKeys = allKeys.filter(
    (key) =>
      key !== "backdropColor" &&
      key !== "canvasColor" &&
      key !== "textColor" &&
      key !== "fontFamily" &&
      key !== "childrenIds"
  );
  
  // Count nested children references
  let totalNestedChildren = 0;
  blockKeys.forEach((key) => {
    const block = structureCopy[key];
    if (block && typeof block === "object" && block.data?.props) {
      if (block.data.props.childrenIds && Array.isArray(block.data.props.childrenIds)) {
        totalNestedChildren += block.data.props.childrenIds.length;
      }
      if (block.data.props.columns && Array.isArray(block.data.props.columns)) {
        block.data.props.columns.forEach((column: any) => {
          if (column.childrenIds && Array.isArray(column.childrenIds)) {
            totalNestedChildren += column.childrenIds.length;
          }
        });
      }
    }
  });
  
  console.log(`[saveTemplateLanguage] Saving template ${templateId}, language ${normalizedLangCode}`);
  console.log(`[saveTemplateLanguage] Structure stats:`, {
    totalKeys: allKeys.length,
    blockCount: blockKeys.length,
    rootChildren: structureCopy?.childrenIds?.length || 0,
    nestedChildren: totalNestedChildren,
    hasContent,
  });
  
  if (!hasContent) {
    console.warn(`[saveTemplateLanguage] Warning: Structure appears empty for ${templateId}/${normalizedLangCode}`);
  }
  
  // Verify all referenced blocks exist
  const missingBlocks: string[] = [];
  if (structureCopy.childrenIds) {
    structureCopy.childrenIds.forEach((id: string) => {
      if (!structureCopy[id]) {
        missingBlocks.push(`root:${id}`);
      }
    });
  }
  blockKeys.forEach((key) => {
    const block = structureCopy[key];
    if (block && typeof block === "object" && block.data?.props) {
      if (block.data.props.childrenIds) {
        block.data.props.childrenIds.forEach((id: string) => {
          if (!structureCopy[id]) {
            missingBlocks.push(`${key}:${id}`);
          }
        });
      }
    }
  });
  
  if (missingBlocks.length > 0) {
    console.error(`[saveTemplateLanguage] ERROR: ${missingBlocks.length} referenced blocks are missing!`, missingBlocks.slice(0, 10));
  }
  
  await prisma.templateLanguage.upsert({
    where: {
      templateId_languageCode: {
        templateId,
        languageCode: normalizedLangCode,
      },
    },
    update: {
      structure: structureCopy,
      updatedAt: new Date(),
    },
    create: {
      templateId,
      languageCode: normalizedLangCode,
      structure: structureCopy,
    },
  });
  
  console.log(`[saveTemplateLanguage] Successfully saved structure for ${templateId}/${normalizedLangCode}`);
}

/**
 * Get template structure for a specific language
 */
export async function getTemplateLanguage(
  templateId: string,
  languageCode: string
): Promise<any | null> {
  const templateLanguage = await prisma.templateLanguage.findUnique({
    where: {
      templateId_languageCode: {
        templateId,
        languageCode: languageCode.toLowerCase(),
      },
    },
  });

  return templateLanguage ? templateLanguage.structure : null;
}

/**
 * Get all language structures for a template
 * Returns a map of languageCode -> structure
 */
export async function getAllTemplateLanguages(
  templateId: string
): Promise<Record<string, any>> {
  const templateLanguages = await prisma.templateLanguage.findMany({
    where: { templateId },
    include: {
      language: {
        select: {
          code: true,
          isActive: true,
        },
      },
    },
  });

  const structures: Record<string, any> = {};

  // Include structures - check if language exists and is active
  // If language relationship doesn't exist, still include the structure
  // (this handles cases where language might not be properly linked)
  for (const tl of templateLanguages) {
    // If language relationship exists, only include if active
    // If language relationship doesn't exist (null), include anyway (fallback)
    if (!tl.language || tl.language.isActive) {
      // Deep copy the structure
      const structureCopy = JSON.parse(JSON.stringify(tl.structure));
      
      // Only include if structure is not null/undefined and has content
      // A valid EmailBuilderDocument should have childrenIds array (even if empty)
      // and at least the base properties (backdropColor, canvasColor, etc.)
      if (structureCopy && typeof structureCopy === 'object') {
        // Check if it has the expected structure format
        const hasChildrenIds = Array.isArray(structureCopy.childrenIds);
        const hasBaseProperties = structureCopy.backdropColor !== undefined || 
                                  structureCopy.canvasColor !== undefined;
        
        if (hasChildrenIds || hasBaseProperties) {
          structures[tl.languageCode] = structureCopy;
        } else {
          console.warn(`[getAllTemplateLanguages] Skipping invalid structure for ${tl.languageCode}`);
        }
      }
    }
  }

  // Log detailed stats for each structure
  Object.entries(structures).forEach(([langCode, structure]) => {
    const allKeys = Object.keys(structure);
    const blockKeys = allKeys.filter(
      (key) =>
        key !== "backdropColor" &&
        key !== "canvasColor" &&
        key !== "textColor" &&
        key !== "fontFamily" &&
        key !== "childrenIds"
    );
    let totalNestedChildren = 0;
    blockKeys.forEach((key) => {
      const block = structure[key];
      if (block && typeof block === "object" && block.data?.props) {
        if (block.data.props.childrenIds && Array.isArray(block.data.props.childrenIds)) {
          totalNestedChildren += block.data.props.childrenIds.length;
        }
        if (block.data.props.columns && Array.isArray(block.data.props.columns)) {
          block.data.props.columns.forEach((column: any) => {
            if (column.childrenIds && Array.isArray(column.childrenIds)) {
              totalNestedChildren += column.childrenIds.length;
            }
          });
        }
      }
    });
    
    // Verify all referenced blocks exist
    const missingBlocks: string[] = [];
    if (structure.childrenIds) {
      structure.childrenIds.forEach((id: string) => {
        if (!structure[id]) {
          missingBlocks.push(`root:${id}`);
        }
      });
    }
    blockKeys.forEach((key) => {
      const block = structure[key];
      if (block && typeof block === "object" && block.data?.props) {
        if (block.data.props.childrenIds) {
          block.data.props.childrenIds.forEach((id: string) => {
            if (!structure[id]) {
              missingBlocks.push(`${key}:${id}`);
            }
          });
        }
      }
    });
    
    console.log(`[getAllTemplateLanguages] Structure ${langCode}:`, {
      totalKeys: allKeys.length,
      blockCount: blockKeys.length,
      rootChildren: structure.childrenIds?.length || 0,
      nestedChildren: totalNestedChildren,
      missingBlocks: missingBlocks.length,
    });
    
    if (missingBlocks.length > 0) {
      console.error(`[getAllTemplateLanguages] ERROR: ${missingBlocks.length} referenced blocks are missing in ${langCode}!`, missingBlocks.slice(0, 10));
    }
  });

  console.log(`[getAllTemplateLanguages] Template ${templateId}: Found ${templateLanguages.length} language entries, returning ${Object.keys(structures).length} structures`);
  console.log(`[getAllTemplateLanguages] Structure keys:`, Object.keys(structures));

  return structures;
}

/**
 * Delete template structure for a specific language
 */
export async function deleteTemplateLanguage(
  templateId: string,
  languageCode: string
): Promise<void> {
  await prisma.templateLanguage.delete({
    where: {
      templateId_languageCode: {
        templateId,
        languageCode: languageCode.toLowerCase(),
      },
    },
  });
}

/**
 * Check if a language structure exists for a template
 */
export async function templateLanguageExists(
  templateId: string,
  languageCode: string
): Promise<boolean> {
  const count = await prisma.templateLanguage.count({
    where: {
      templateId,
      languageCode: languageCode.toLowerCase(),
    },
  });

  return count > 0;
}


