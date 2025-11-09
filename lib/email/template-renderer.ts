/**
 * Template Renderer Service
 * Renders email templates with variable replacement and processing
 */

import { renderTemplate } from "./variable-renderer";
import { extractVariables } from "./variable-parser";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";
import { renderToStaticMarkup } from "@/lib/email-builder/renderer";
import { loadTranslations } from "@/lib/translations/loader";
import { replaceTextWithTranslations } from "@/lib/translations/replacer";
import { logMissingTranslation } from "@/lib/translations/logger";

export interface RenderOptions {
  sampleData?: Record<string, any>;
  language?: string;
  replaceVariables?: boolean;
  templateId?: string;
  defaultLanguage?: string;
}

/**
 * Render email template to HTML
 */
export async function renderEmailTemplate(
  document: EmailBuilderDocument,
  options: RenderOptions = {}
): Promise<{ html: string; text: string; missingTranslations?: string[] }> {
  const {
    sampleData = {},
    replaceVariables = true,
    language,
    templateId,
    defaultLanguage = "en",
  } = options;

  let documentToRender = document;
  const missingTranslations: string[] = [];

  // Load and apply translations if language is specified
  if (language && templateId && language !== defaultLanguage) {
    try {
      const translations = await loadTranslations(templateId, language);

      // Replace text with translations
      documentToRender = replaceTextWithTranslations(document, translations);

      // If no translations found, try fallback to default language
      if (translations.size === 0) {
        const defaultTranslations = await loadTranslations(templateId, defaultLanguage);
        if (defaultTranslations.size > 0) {
          documentToRender = replaceTextWithTranslations(document, defaultTranslations);
          // Log missing translations
          missingTranslations.push(
            `No translations found for ${language}, using ${defaultLanguage}`
          );
        } else {
          // Even default language has no translations
          missingTranslations.push(
            `No translations available for ${language} or ${defaultLanguage}`
          );
        }
      } else {
        // Check for missing translations by comparing with original
        // (This would require extracting translatable items again)
        // For now, we'll rely on the translation status from the database
      }
    } catch (error) {
      console.error("Error loading translations:", error);
      // Continue with original document if translation loading fails
      missingTranslations.push(`Failed to load translations for ${language}`);
    }
  }

  // First, render the document structure to HTML
  let html = renderToStaticMarkup(documentToRender);

  // If we have sample data and variables should be replaced
  if (replaceVariables && Object.keys(sampleData).length > 0) {
    // Process conditionals, loops, and variables
    html = renderTemplate(html, sampleData);
  }

  // Generate plain text version (simple HTML to text conversion)
  const text = htmlToPlainText(html);

  return {
    html,
    text,
    ...(missingTranslations.length > 0 && { missingTranslations }),
  };
}

/**
 * Convert HTML to plain text
 */
function htmlToPlainText(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  // Replace HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Replace line breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, "");
  
  // Clean up whitespace
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n");
  text = text.trim();
  
  return text;
}

/**
 * Extract all variables from a template document
 */
export function extractTemplateVariables(
  document: EmailBuilderDocument
): string[] {
  const variables: string[] = [];
  
  // Recursively extract variables from all blocks
  const extractFromBlock = (blockId: string) => {
    const block = document[blockId] as any;
    if (!block || typeof block !== "object") return;
    
    // Extract from block props
    if (block.data?.props) {
      const propsJson = JSON.stringify(block.data.props);
      const extracted = extractVariables(propsJson);
      extracted.forEach(v => {
        if (!variables.includes(v.name)) {
          variables.push(v.name);
        }
      });
    }
    
    // Recursively process children
    if (block.data?.props?.childrenIds) {
      block.data.props.childrenIds.forEach((childId: string) => {
        extractFromBlock(childId);
      });
    }
    
    // Process columns
    if (block.data?.props?.columns) {
      block.data.props.columns.forEach((column: any) => {
        if (column.childrenIds) {
          column.childrenIds.forEach((childId: string) => {
            extractFromBlock(childId);
          });
        }
      });
    }
  };
  
  // Process all root children
  if (document.childrenIds) {
    document.childrenIds.forEach(blockId => {
      extractFromBlock(blockId);
    });
  }
  
  return variables;
}

/**
 * Validate template variables against available data
 */
export function validateTemplateVariables(
  document: EmailBuilderDocument,
  availableData: Record<string, any>
): { valid: string[]; invalid: string[] } {
  const templateVariables = extractTemplateVariables(document);
  const valid: string[] = [];
  const invalid: string[] = [];
  
  templateVariables.forEach(variable => {
    const pathParts = variable.split(".");
    let current = availableData;
    let isValid = true;
    
    for (const part of pathParts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        isValid = false;
        break;
      }
    }
    
    if (isValid) {
      valid.push(variable);
    } else {
      invalid.push(variable);
    }
  });
  
  return { valid, invalid };
}

