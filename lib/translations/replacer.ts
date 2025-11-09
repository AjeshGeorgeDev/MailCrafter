/**
 * Translation Replacer
 * Replaces text in template structure with translations
 */

import type { EmailBuilderDocument, EmailBlock } from "@/lib/email-builder/types";

/**
 * Replace text in document with translations
 */
export function replaceTextWithTranslations(
  document: EmailBuilderDocument,
  translations: Map<string, string>
): EmailBuilderDocument {
  // Clone document to avoid mutating original
  const translatedDocument = JSON.parse(JSON.stringify(document)) as EmailBuilderDocument;

  // Helper to replace text in a block
  const replaceInBlock = (blockId: string, block: EmailBlock) => {
    const blockType = block.type;

    switch (blockType) {
      case "Text":
        const textKey = `${blockId}_text_0`;
        const textTranslation = translations.get(textKey);
        if (textTranslation !== undefined) {
          block.data.props.text = textTranslation;
        }
        break;

      case "Heading":
        const headingKey = `${blockId}_heading_0`;
        const headingTranslation = translations.get(headingKey);
        if (headingTranslation !== undefined) {
          block.data.props.text = headingTranslation;
        }
        break;

      case "Button":
        const buttonKey = `${blockId}_button_0`;
        const buttonTranslation = translations.get(buttonKey);
        if (buttonTranslation !== undefined) {
          block.data.props.text = buttonTranslation;
        }
        break;

      case "List":
        const listItems = block.data.props.items || [];
        listItems.forEach((_: string, index: number) => {
          const listKey = `${blockId}_list-item_${index}`;
          const listTranslation = translations.get(listKey);
          if (listTranslation !== undefined) {
            listItems[index] = listTranslation;
          }
        });
        block.data.props.items = listItems;
        break;

      case "Hero":
        const heroTitleKey = `${blockId}_hero-title_0`;
        const heroTitleTranslation = translations.get(heroTitleKey);
        if (heroTitleTranslation !== undefined) {
          (block.data.props as any).heading = heroTitleTranslation;
        }

        const heroSubtitleKey = `${blockId}_hero-subtitle_0`;
        const heroSubtitleTranslation = translations.get(heroSubtitleKey);
        if (heroSubtitleTranslation !== undefined) {
          (block.data.props as any).subheading = heroSubtitleTranslation;
        }

        const heroButtonKey = `${blockId}_hero-button_0`;
        const heroButtonTranslation = translations.get(heroButtonKey);
        if (heroButtonTranslation !== undefined) {
          (block.data.props as any).buttonText = heroButtonTranslation;
        }
        break;

      case "Quote":
        const quoteTextKey = `${blockId}_quote-text_0`;
        const quoteTextTranslation = translations.get(quoteTextKey);
        if (quoteTextTranslation !== undefined) {
          (block.data.props as any).quote = quoteTextTranslation;
        }

        const quoteAuthorKey = `${blockId}_quote-author_0`;
        const quoteAuthorTranslation = translations.get(quoteAuthorKey);
        if (quoteAuthorTranslation !== undefined) {
          (block.data.props as any).author = quoteAuthorTranslation;
        }
        break;
    }

    // Recursively process children
    if ((block.data.props as any).childrenIds) {
      ((block.data.props as any).childrenIds as string[]).forEach((childId: string) => {
        const childBlock = translatedDocument[childId] as EmailBlock | undefined;
        if (childBlock) {
          replaceInBlock(childId, childBlock);
        }
      });
    }

    // Process columns
    if (blockType === "Columns" && (block.data.props as any).columns) {
      ((block.data.props as any).columns as any[]).forEach((column: any) => {
        if (column.childrenIds) {
          (column.childrenIds as string[]).forEach((childId: string) => {
            const childBlock = translatedDocument[childId] as EmailBlock | undefined;
            if (childBlock) {
              replaceInBlock(childId, childBlock);
            }
          });
        }
      });
    }
  };

  // Process all root children
  if (translatedDocument.childrenIds) {
    translatedDocument.childrenIds.forEach((blockId) => {
      const block = translatedDocument[blockId] as EmailBlock | undefined;
      if (block) {
        replaceInBlock(blockId, block);
      }
    });
  }

  return translatedDocument;
}

