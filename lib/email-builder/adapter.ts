/**
 * Adapter functions to convert between different email builder formats
 */

import type { EmailBuilderDocument } from "./types";
import type { EmailDocument as OldEmailDocument } from "../email/types";

/**
 * Convert old EmailDocument to new EmailBuilderDocument
 */
export function fromOldFormat(oldDoc: OldEmailDocument): EmailBuilderDocument {
  // If it's already in new format, return as-is
  if ("backdropColor" in oldDoc && "canvasColor" in oldDoc) {
    return oldDoc as unknown as EmailBuilderDocument;
  }

  // Default new document structure
  const newDoc: EmailBuilderDocument = {
    backdropColor: "#F8F8F8",
    canvasColor: "#FFFFFF",
    textColor: "#242424",
    fontFamily: "MODERN_SANS",
    childrenIds: [],
  };

  // Try to extract root children if exists
  if (oldDoc.root && oldDoc.root.data && oldDoc.root.data.childrenIds) {
    newDoc.childrenIds = [...oldDoc.root.data.childrenIds];
    
    // Copy root properties
    if (oldDoc.root.data.backdropColor) {
      newDoc.backdropColor = oldDoc.root.data.backdropColor;
    }
    if (oldDoc.root.data.canvasColor) {
      newDoc.canvasColor = oldDoc.root.data.canvasColor;
    }
    if (oldDoc.root.data.textColor) {
      newDoc.textColor = oldDoc.root.data.textColor;
    }
    if (oldDoc.root.data.fontFamily) {
      newDoc.fontFamily = oldDoc.root.data.fontFamily as any;
    }

    // Copy all blocks
    Object.keys(oldDoc).forEach((key) => {
      if (key !== "root" && oldDoc[key]) {
        const oldBlock = oldDoc[key] as any;
        // Convert old block format to new format
        const newBlock = convertBlock(oldBlock);
        if (newBlock) {
          newDoc[key] = newBlock;
        }
      }
    });
  }

  return newDoc;
}

/**
 * Convert old block format to new block format
 */
function convertBlock(oldBlock: any): any {
  if (!oldBlock || !oldBlock.type) {
    return null;
  }

  // If already in new format (has data.style and data.props)
  if (oldBlock.data && oldBlock.data.style && oldBlock.data.props) {
    return oldBlock;
  }

  // Convert from old format
  const newBlock = {
    type: oldBlock.type,
    data: {
      style: {
        padding: oldBlock.style?.padding || { top: 0, bottom: 0, left: 0, right: 0 },
        backgroundColor: oldBlock.style?.backgroundColor || null,
        color: oldBlock.style?.textColor || oldBlock.style?.color || null,
        fontSize: oldBlock.style?.fontSize,
        fontWeight: oldBlock.style?.fontWeight || "normal",
        textAlign: oldBlock.style?.textAlign || "left",
      },
      props: oldBlock.props || {},
    },
  };

  return newBlock;
}

/**
 * Convert new EmailBuilderDocument to old EmailDocument format
 * (for backward compatibility if needed)
 */
export function toOldFormat(newDoc: EmailBuilderDocument): OldEmailDocument {
  const oldDoc: any = {
    root: {
      type: "EmailLayout",
      data: {
        backdropColor: newDoc.backdropColor,
        canvasColor: newDoc.canvasColor,
        textColor: newDoc.textColor,
        fontFamily: newDoc.fontFamily,
        childrenIds: newDoc.childrenIds,
      },
    },
  };

  // Copy all blocks
  Object.keys(newDoc).forEach((key) => {
    if (
      key !== "backdropColor" &&
      key !== "canvasColor" &&
      key !== "textColor" &&
      key !== "fontFamily" &&
      key !== "childrenIds"
    ) {
      const newBlock = newDoc[key] as any;
      // Convert new block format to old format
      const oldBlock = convertBlockToOldFormat(newBlock);
      if (oldBlock) {
        oldDoc[key] = oldBlock;
      }
    }
  });

  return oldDoc;
}

/**
 * Convert new block format to old block format
 */
function convertBlockToOldFormat(newBlock: any): any {
  if (!newBlock || !newBlock.type) {
    return null;
  }

  const oldBlock: any = {
    type: newBlock.type,
    style: {
      padding: newBlock.data.style.padding || { top: 0, bottom: 0, left: 0, right: 0 },
      backgroundColor: newBlock.data.style.backgroundColor || null,
      textColor: newBlock.data.style.color || null,
      fontSize: newBlock.data.style.fontSize,
      fontWeight: newBlock.data.style.fontWeight || "normal",
      textAlign: newBlock.data.style.textAlign || "left",
    },
    props: newBlock.data.props || {},
  };

  return oldBlock;
}

