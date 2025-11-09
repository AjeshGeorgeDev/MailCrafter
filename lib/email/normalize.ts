// Normalize template structure to ensure it's a valid EmailDocument
import { EmailDocument } from "./types";

export function normalizeTemplateStructure(structure: any): EmailDocument {
  // If structure is already a valid EmailDocument
  if (structure && structure.root && structure.root.type === "EmailLayout" && structure.root.data) {
    return structure;
  }

  // If structure is an array (legacy format) or empty/null
  if (Array.isArray(structure) || !structure || !structure.root) {
    return {
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#F8F8F8",
          canvasColor: "#FFFFFF",
          textColor: "#242424",
          fontFamily: "MODERN_SANS",
          childrenIds: [],
        },
      },
    };
  }

  // If structure has root but missing data
  if (structure.root && !structure.root.data) {
    return {
      ...structure,
      root: {
        type: "EmailLayout",
        data: {
          backdropColor: "#F8F8F8",
          canvasColor: "#FFFFFF",
          textColor: "#242424",
          fontFamily: "MODERN_SANS",
          childrenIds: structure.root.childrenIds || [],
        },
      },
    };
  }

  // Return as-is if it looks valid
  return structure;
}

