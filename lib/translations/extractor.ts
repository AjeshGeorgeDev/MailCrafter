/**
 * Translation Extractor
 * Extracts translatable text from email template structure
 */

import type { EmailBuilderDocument, EmailBlock } from "@/lib/email-builder/types";

export interface TranslatableItem {
  blockId: string;
  translationKey: string;
  blockType: string;
  originalText: string;
  context?: string;
}

/**
 * Extract translatable text from template document
 */
export function extractTranslatableText(
  document: EmailBuilderDocument
): TranslatableItem[] {
  const items: TranslatableItem[] = [];

  // Helper to extract text from a block
  const extractFromBlock = (blockId: string, block: EmailBlock) => {
    const blockType = block.type;

    // Extract text based on block type
    switch (blockType) {
      case "Text":
        const textContent = block.data.props.text;
        if (textContent && !isOnlyVariable(textContent)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "text", 0),
            blockType: "text",
            originalText: textContent,
            context: "Text block",
          });
        }
        break;

      case "Heading":
        const headingContent = block.data.props.text;
        if (headingContent && !isOnlyVariable(headingContent)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "heading", 0),
            blockType: "heading",
            originalText: headingContent,
            context: `Heading ${block.data.props.level}`,
          });
        }
        break;

      case "Button":
        const buttonText = block.data.props.text;
        if (buttonText && !isOnlyVariable(buttonText)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "button", 0),
            blockType: "button",
            originalText: buttonText,
            context: "Button text",
          });
        }
        break;

      case "List":
        const listItems = block.data.props.items || [];
        listItems.forEach((item: string, index: number) => {
          if (item && !isOnlyVariable(item)) {
            items.push({
              blockId,
              translationKey: generateKey(blockId, "list-item", index),
              blockType: "list",
              originalText: item,
              context: `List item ${index + 1}`,
            });
          }
        });
        break;

      case "Hero":
        const heroTitle = (block.data.props as any).heading;
        const heroSubtitle = (block.data.props as any).subheading;
        const heroButtonText = (block.data.props as any).buttonText;

        if (heroTitle && !isOnlyVariable(heroTitle)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "hero-title", 0),
            blockType: "hero",
            originalText: heroTitle,
            context: "Hero title",
          });
        }
        if (heroSubtitle && !isOnlyVariable(heroSubtitle)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "hero-subtitle", 0),
            blockType: "hero",
            originalText: heroSubtitle,
            context: "Hero subtitle",
          });
        }
        if (heroButtonText && !isOnlyVariable(heroButtonText)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "hero-button", 0),
            blockType: "hero",
            originalText: heroButtonText,
            context: "Hero button",
          });
        }
        break;

      case "Quote":
        const quoteText = (block.data.props as any).quote;
        const quoteAuthor = (block.data.props as any).author;

        if (quoteText && !isOnlyVariable(quoteText)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "quote-text", 0),
            blockType: "quote",
            originalText: quoteText,
            context: "Quote text",
          });
        }
        if (quoteAuthor && !isOnlyVariable(quoteAuthor)) {
          items.push({
            blockId,
            translationKey: generateKey(blockId, "quote-author", 0),
            blockType: "quote",
            originalText: quoteAuthor,
            context: "Quote author",
          });
        }
        break;

      case "SocialLinks":
        // Social links typically don't need translation (they're URLs)
        break;

      case "HTML":
        // HTML blocks might contain translatable content, but we'll skip for now
        // as they can contain complex HTML
        break;

      case "Container":
      case "Columns":
      case "Divider":
      case "Spacer":
      case "Avatar":
        // These blocks don't contain translatable text
        break;
    }

    // Recursively process children
    if ((block.data.props as any).childrenIds) {
      (block.data.props as any).childrenIds.forEach((childId: string) => {
        const childBlock = document[childId] as EmailBlock | undefined;
        if (childBlock) {
          extractFromBlock(childId, childBlock);
        }
      });
    }

    // Process columns
    if (blockType === "Columns" && (block.data.props as any).columns) {
      ((block.data.props as any).columns as any[]).forEach((column: any) => {
        if (column.childrenIds) {
          (column.childrenIds as string[]).forEach((childId: string) => {
            const childBlock = document[childId] as EmailBlock | undefined;
            if (childBlock) {
              extractFromBlock(childId, childBlock);
            }
          });
        }
      });
    }
  };

  // Process all root children
  if (document.childrenIds) {
    document.childrenIds.forEach((blockId) => {
      const block = document[blockId] as EmailBlock | undefined;
      if (block) {
        extractFromBlock(blockId, block);
      }
    });
  }

  return items;
}

/**
 * Check if text contains only variables (no translatable content)
 */
function isOnlyVariable(text: string): boolean {
  // Remove all variable patterns {{...}}
  const withoutVariables = text.replace(/\{\{[^}]+\}\}/g, "");
  // Check if only whitespace remains
  return withoutVariables.trim().length === 0;
}

/**
 * Generate unique translation key
 */
function generateKey(blockId: string, field: string, index: number): string {
  return `${blockId}_${field}_${index}`;
}

/**
 * Clean text by preserving variables
 * Removes HTML tags but keeps variable placeholders
 */
export function cleanTextForTranslation(text: string): string {
  // For now, we'll keep HTML as-is and let translators handle it
  // In a more advanced version, we could strip HTML tags
  return text;
}

