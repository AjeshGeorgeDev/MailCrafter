/**
 * Predefined Email Templates
 * Ready-to-use templates that can be loaded into the EmailBuilder
 */

import type { EmailBuilderDocument } from "@/lib/email-builder/types";

export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  structure: EmailBuilderDocument;
}

/**
 * Generate unique block IDs for a template
 * This ensures all block IDs are unique within a template
 */
function generateUniqueBlockIds(
  structure: EmailBuilderDocument,
  prefix: string = "block"
): EmailBuilderDocument {
  // Validate structure is complete before processing
  if (!structure || typeof structure !== 'object') {
    console.error(`[generateUniqueBlockIds] ERROR: Invalid structure passed in!`, structure);
    throw new Error("Invalid structure: structure must be an object");
  }

  const idMap = new Map<string, string>();
  const newStructure: EmailBuilderDocument = {
    backdropColor: structure.backdropColor,
    canvasColor: structure.canvasColor,
    textColor: structure.textColor,
    fontFamily: structure.fontFamily,
    childrenIds: [],
  };

  // Collect all block keys (excluding metadata keys)
  const allKeys = Object.keys(structure);
  const blockKeys = allKeys.filter(
    (key) =>
      key !== "backdropColor" &&
      key !== "canvasColor" &&
      key !== "textColor" &&
      key !== "fontFamily" &&
      key !== "childrenIds"
  );

  console.log(`[generateUniqueBlockIds] Processing ${blockKeys.length} blocks with prefix "${prefix}"`);
  console.log(`[generateUniqueBlockIds] Original structure has ${allKeys.length} total keys`);
  console.log(`[generateUniqueBlockIds] Block keys (first 20):`, blockKeys.slice(0, 20));
  
  // Log structure type and check if it's been processed before
  const firstBlockKey = blockKeys[0];
  if (firstBlockKey) {
    const firstBlock = structure[firstBlockKey] as any;
    console.log(`[generateUniqueBlockIds] First block sample:`, {
      key: firstBlockKey,
      type: firstBlock?.type,
      hasData: !!firstBlock?.data,
    });
    
    // Check if structure already has unique IDs (starts with prefix)
    if (firstBlockKey.startsWith(prefix + "-")) {
      console.warn(`[generateUniqueBlockIds] WARNING: Structure appears to already have unique IDs with prefix "${prefix}"!`);
      console.warn(`[generateUniqueBlockIds] This suggests the structure was already processed. Block keys:`, blockKeys.slice(0, 5));
    }
  }

  // Collect all referenced block IDs (from childrenIds and nested childrenIds)
  const allReferencedIds = new Set<string>();
  if (structure.childrenIds) {
    structure.childrenIds.forEach((id: string) => allReferencedIds.add(id));
  }
  blockKeys.forEach((key) => {
    const block = structure[key] as any;
    if (block && typeof block === "object" && block.data?.props) {
      if (block.data.props.childrenIds && Array.isArray(block.data.props.childrenIds)) {
        block.data.props.childrenIds.forEach((id: string) => allReferencedIds.add(id));
      }
      if (block.data.props.columns && Array.isArray(block.data.props.columns)) {
        block.data.props.columns.forEach((column: any) => {
          if (column.childrenIds && Array.isArray(column.childrenIds)) {
            column.childrenIds.forEach((id: string) => allReferencedIds.add(id));
          }
        });
      }
    }
  });

  // Check if all referenced IDs exist in blockKeys
  const missingReferencedIds = Array.from(allReferencedIds).filter((id) => !blockKeys.includes(id));
  if (missingReferencedIds.length > 0) {
    console.error(`[generateUniqueBlockIds] ERROR: ${missingReferencedIds.length} referenced block IDs are missing from structure keys!`, missingReferencedIds);
    console.error(`[generateUniqueBlockIds] This means the structure passed in is incomplete or malformed.`);
    console.error(`[generateUniqueBlockIds] Structure keys count: ${blockKeys.length}, Referenced IDs count: ${allReferencedIds.size}`);
    console.error(`[generateUniqueBlockIds] Missing IDs:`, missingReferencedIds);
    console.error(`[generateUniqueBlockIds] Sample of available block keys:`, blockKeys.slice(0, 10));
    
    // Try to find where these IDs are referenced
    console.error(`[generateUniqueBlockIds] Checking where missing IDs are referenced...`);
    if (structure.childrenIds) {
      const missingInRoot = structure.childrenIds.filter((id: string) => missingReferencedIds.includes(id));
      if (missingInRoot.length > 0) {
        console.error(`[generateUniqueBlockIds] Missing IDs in root childrenIds:`, missingInRoot);
      }
    }
    blockKeys.forEach((key) => {
      const block = structure[key] as any;
      if (block && typeof block === "object" && block.data?.props) {
        if (block.data.props.childrenIds) {
          const missingInBlock = block.data.props.childrenIds.filter((id: string) => missingReferencedIds.includes(id));
          if (missingInBlock.length > 0) {
            console.error(`[generateUniqueBlockIds] Missing IDs in block "${key}":`, missingInBlock);
          }
        }
      }
    });
    
    // Don't throw error, but log extensively - we'll try to continue but it will fail
  }

  // Generate new IDs for all blocks
  blockKeys.forEach((key) => {
    const newId = `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
    idMap.set(key, newId);
    newStructure[newId] = structure[key];
  });

  console.log(`[generateUniqueBlockIds] Created ${idMap.size} ID mappings`);
  console.log(`[generateUniqueBlockIds] New structure has ${Object.keys(newStructure).length} keys`);
  console.log(`[generateUniqueBlockIds] Total referenced IDs: ${allReferencedIds.size}, Missing: ${missingReferencedIds.length}`);

  // Update childrenIds references
  if (structure.childrenIds) {
    newStructure.childrenIds = structure.childrenIds.map((id) => {
      const mappedId = idMap.get(id);
      if (!mappedId) {
        console.error(`[generateUniqueBlockIds] ERROR: Root child ID "${id}" not found in idMap!`);
        return id; // Keep original ID as fallback, but this will cause issues
      }
      return mappedId;
    });
    console.log(`[generateUniqueBlockIds] Updated root childrenIds: ${structure.childrenIds.length} -> ${newStructure.childrenIds.length}`);
  }

  // Update all nested childrenIds in blocks (Container, Columns, etc.)
  let nestedChildrenUpdated = 0;
  Object.keys(newStructure).forEach((newBlockId) => {
    const block = newStructure[newBlockId] as any;
    if (block && typeof block === "object" && block.data?.props) {
      // Handle Container blocks
      if (block.data.props.childrenIds && Array.isArray(block.data.props.childrenIds)) {
        const originalChildren = [...block.data.props.childrenIds];
        block.data.props.childrenIds = block.data.props.childrenIds.map((id: string) => {
          const mappedId = idMap.get(id);
          if (!mappedId) {
            console.error(`[generateUniqueBlockIds] ERROR: Child ID "${id}" in Container "${newBlockId}" not found in idMap!`);
            return id; // Keep original ID as fallback, but this will cause issues
          }
          return mappedId;
        });
        // Verify all children were mapped
        const unmapped = originalChildren.filter((id: string) => !idMap.has(id));
        if (unmapped.length > 0) {
          console.warn(`[generateUniqueBlockIds] WARNING: Some children IDs were not mapped:`, unmapped);
        }
        nestedChildrenUpdated += block.data.props.childrenIds.length;
      }
      // Handle Columns blocks
      if (block.data.props.columns && Array.isArray(block.data.props.columns)) {
        block.data.props.columns = block.data.props.columns.map((column: any) => {
          if (column.childrenIds && Array.isArray(column.childrenIds)) {
            const originalChildren = [...column.childrenIds];
            const newChildrenIds = column.childrenIds.map((id: string) => {
              const mappedId = idMap.get(id);
              if (!mappedId) {
                console.error(`[generateUniqueBlockIds] ERROR: Child ID "${id}" in Column not found in idMap!`);
                return id; // Keep original ID as fallback, but this will cause issues
              }
              return mappedId;
            });
            // Verify all children were mapped
            const unmapped = originalChildren.filter((id: string) => !idMap.has(id));
            if (unmapped.length > 0) {
              console.warn(`[generateUniqueBlockIds] WARNING: Some column children IDs were not mapped:`, unmapped);
            }
            nestedChildrenUpdated += newChildrenIds.length;
            return {
              ...column,
              childrenIds: newChildrenIds,
            };
          }
          return column;
        });
      }
    }
  });

  console.log(`[generateUniqueBlockIds] Updated ${nestedChildrenUpdated} nested children references`);

  // Verify all referenced blocks exist in new structure
  const verifyBlockExists = (blockId: string, context: string) => {
    if (!newStructure[blockId]) {
      console.error(`[generateUniqueBlockIds] ERROR: Block ${blockId} referenced in ${context} but not found in new structure!`);
      console.error(`[generateUniqueBlockIds] Available block IDs:`, Object.keys(newStructure).filter(k => k !== "backdropColor" && k !== "canvasColor" && k !== "textColor" && k !== "fontFamily" && k !== "childrenIds").slice(0, 10));
    }
  };

  // Verify root children
  newStructure.childrenIds?.forEach((id) => verifyBlockExists(id, "root childrenIds"));

  // Verify nested children
  Object.values(newStructure).forEach((block: any) => {
    if (block && typeof block === "object" && block.data?.props) {
      if (block.data.props.childrenIds) {
        block.data.props.childrenIds.forEach((id: string) => verifyBlockExists(id, `Container ${Object.keys(newStructure).find(k => newStructure[k] === block)}`));
      }
      if (block.data.props.columns) {
        block.data.props.columns.forEach((column: any, colIndex: number) => {
          if (column.childrenIds) {
            column.childrenIds.forEach((id: string) => verifyBlockExists(id, `Column ${colIndex}`));
          }
        });
      }
    }
  });

  return newStructure;
}

/**
 * Welcome Email Template
 */
export const welcomeEmailTemplate: EmailBuilderDocument = {
  backdropColor: "#F8F8F8",
  canvasColor: "#FFFFFF",
  textColor: "#242424",
  fontFamily: "MODERN_SANS",
  childrenIds: ["header", "hero", "content", "cta", "footer"],
  header: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["header-logo"],
      },
    },
  },
  "header-logo": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/200x60",
        alt: "Company Logo",
        contentAlignment: "center",
      },
    },
  },
  hero: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#2563EB",
      },
      props: {
        childrenIds: ["hero-heading", "hero-text"],
      },
    },
  },
  "hero-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        color: "#FFFFFF",
        textAlign: "center",
        fontSize: 32,
        fontWeight: "bold",
      },
      props: {
        text: "Welcome to Our Platform!",
        level: "1",
      },
    },
  },
  "hero-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        color: "#FFFFFF",
        textAlign: "center",
        fontSize: 16,
      },
      props: {
        text: "We're thrilled to have you join us! Start your journey by exploring all the amazing features we have to offer.",
      },
    },
  },
  content: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["content-heading", "content-text", "spacer-1"],
      },
    },
  },
  "content-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 24,
        fontWeight: "bold",
      },
      props: {
        text: "Getting Started",
        level: "2",
      },
    },
  },
  "content-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "left",
        fontSize: 16,
      },
      props: {
        text: "Here are a few things you can do to get the most out of your account:\n\n• Complete your profile to personalize your experience\n• Explore our features and discover what we offer\n• Connect with our community and join the conversation\n• Check out our resources and helpful guides",
      },
    },
  },
  "spacer-1": {
    type: "Spacer",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      props: {
        height: 30,
      },
    },
  },
  cta: {
    type: "Container",
    data: {
      style: {
        padding: { top: 0, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["cta-button"],
      },
    },
  },
  "cta-button": {
    type: "Button",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        text: "Get Started",
        url: "https://example.com/dashboard",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
        fullWidth: false,
      },
    },
  },
  footer: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#F8F8F8",
      },
      props: {
        childrenIds: ["footer-text", "footer-social"],
      },
    },
  },
  "footer-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 20, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
      },
      props: {
        text: "© 2024 MailCrafter. All rights reserved.\n\nYou're receiving this email because you signed up for our platform.",
      },
    },
  },
  "footer-social": {
    type: "SocialLinks",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        socialLinks: [
          { platform: "facebook", url: "https://facebook.com" },
          { platform: "twitter", url: "https://twitter.com" },
          { platform: "linkedin", url: "https://linkedin.com" },
        ],
        iconSize: 24,
        iconColor: "#6B7280",
      },
    },
  },
};

/**
 * Newsletter Template
 */
export const newsletterTemplate: EmailBuilderDocument = {
  backdropColor: "#F8F8F8",
  canvasColor: "#FFFFFF",
  textColor: "#242424",
  fontFamily: "MODERN_SANS",
  childrenIds: ["header", "hero", "articles", "footer"],
  header: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["header-logo"],
      },
    },
  },
  "header-logo": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "left",
      },
      props: {
        url: "https://via.placeholder.com/200x60",
        alt: "Logo",
        contentAlignment: "left",
      },
    },
  },
  hero: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["hero-heading", "hero-date"],
      },
    },
  },
  "hero-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 28,
        fontWeight: "bold",
      },
      props: {
        text: "Monthly Newsletter",
        level: "1",
      },
    },
  },
  "hero-date": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 14,
        color: "#6B7280",
      },
      props: {
        text: "December 2024",
      },
    },
  },
  articles: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["article-1", "divider-1", "article-2"],
      },
    },
  },
  "article-1": {
    type: "Container",
    data: {
      style: {
        padding: { top: 0, bottom: 30, left: 0, right: 0 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["article-1-image", "article-1-heading", "article-1-text", "article-1-button"],
      },
    },
  },
  "article-1-image": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/600x300",
        alt: "Article Image",
        contentAlignment: "center",
      },
    },
  },
  "article-1-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        fontSize: 22,
        fontWeight: "bold",
      },
      props: {
        text: "5 Tips for Better Email Marketing",
        level: "2",
      },
    },
  },
  "article-1-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 16,
      },
      props: {
        text: "Discover proven strategies to improve your email marketing campaigns and increase engagement with your audience.",
      },
    },
  },
  "article-1-button": {
    type: "Button",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      props: {
        text: "Read More",
        url: "https://example.com/article1",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
        fullWidth: false,
      },
    },
  },
  "divider-1": {
    type: "Divider",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      props: {
        lineColor: "#E5E7EB",
        lineHeight: 1,
      },
    },
  },
  "article-2": {
    type: "Container",
    data: {
      style: {
        padding: { top: 30, bottom: 0, left: 0, right: 0 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["article-2-heading", "article-2-text", "article-2-button"],
      },
    },
  },
  "article-2-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        fontSize: 22,
        fontWeight: "bold",
      },
      props: {
        text: "New Features You'll Love",
        level: "2",
      },
    },
  },
  "article-2-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 16,
      },
      props: {
        text: "We've been working hard to bring you exciting new features that will make your experience even better.",
      },
    },
  },
  "article-2-button": {
    type: "Button",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      props: {
        text: "Read More",
        url: "https://example.com/article2",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
        fullWidth: false,
      },
    },
  },
  footer: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#F8F8F8",
      },
      props: {
        childrenIds: ["footer-text"],
      },
    },
  },
  "footer-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
      },
      props: {
        text: "© 2024 MailCrafter. All rights reserved.\n\nUnsubscribe | Manage Preferences",
      },
    },
  },
};

/**
 * Transactional Email Template (Order Confirmation)
 */
export const transactionalTemplate: EmailBuilderDocument = {
  backdropColor: "#F8F8F8",
  canvasColor: "#FFFFFF",
  textColor: "#242424",
  fontFamily: "MODERN_SANS",
  childrenIds: ["header", "content", "order-details", "footer"],
  header: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["header-logo"],
      },
    },
  },
  "header-logo": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "left",
      },
      props: {
        url: "https://via.placeholder.com/200x60",
        alt: "Logo",
        contentAlignment: "left",
      },
    },
  },
  content: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["content-heading", "content-text"],
      },
    },
  },
  "content-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 24,
        fontWeight: "bold",
      },
      props: {
        text: "Order Confirmation",
        level: "2",
      },
    },
  },
  "content-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        fontSize: 16,
      },
      props: {
        text: "Hi there,\n\nThank you for your order! We've received your order #12345 and it's being processed.\n\nYou'll receive a shipping confirmation email once your order ships.",
      },
    },
  },
  "order-details": {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#F8F8F8",
      },
      props: {
        childrenIds: ["order-heading", "order-items", "order-total"],
      },
    },
  },
  "order-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 18,
        fontWeight: "bold",
      },
      props: {
        text: "Order Details",
        level: "3",
      },
    },
  },
  "order-items": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 14,
      },
      props: {
        text: "• Product 1 - $29.99\n• Product 2 - $49.99\n• Shipping - $5.00",
      },
    },
  },
  "order-total": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        fontSize: 16,
        fontWeight: "bold",
      },
      props: {
        text: "Total: $84.98",
      },
    },
  },
  footer: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["footer-text"],
      },
    },
  },
  "footer-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
      },
      props: {
        text: "Questions? Contact us at support@example.com\n\n© 2024 MailCrafter. All rights reserved.",
      },
    },
  },
};

/**
 * Promotional Email Template
 */
export const promotionalTemplate: EmailBuilderDocument = {
  backdropColor: "#F8F8F8",
  canvasColor: "#FFFFFF",
  textColor: "#242424",
  fontFamily: "MODERN_SANS",
  childrenIds: ["header", "hero", "features", "cta", "footer"],
  header: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["header-logo"],
      },
    },
  },
  "header-logo": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/200x60",
        alt: "Logo",
        contentAlignment: "center",
      },
    },
  },
  hero: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["hero-image", "hero-heading", "hero-text"],
      },
    },
  },
  "hero-image": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 20, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/600x300",
        alt: "Promotion",
        contentAlignment: "center",
      },
    },
  },
  "hero-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 32,
        fontWeight: "bold",
      },
      props: {
        text: "Special Offer - Limited Time!",
        level: "1",
      },
    },
  },
  "hero-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 18,
      },
      props: {
        text: "Don't miss out on our exclusive promotion. Get amazing discounts on all premium features!",
      },
    },
  },
  features: {
    type: "Columns",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        columns: [
          {
            childrenIds: ["feature-1-image", "feature-1-heading", "feature-1-text"],
          },
          {
            childrenIds: ["feature-2-image", "feature-2-heading", "feature-2-text"],
          },
          {
            childrenIds: ["feature-3-image", "feature-3-heading", "feature-3-text"],
          },
        ],
      },
    },
  },
  "feature-1-image": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/200x200",
        alt: "Feature 1",
        contentAlignment: "center",
      },
    },
  },
  "feature-1-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
      },
      props: {
        text: "Easy to Use",
        level: "3",
      },
    },
  },
  "feature-1-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 14,
      },
      props: {
        text: "Intuitive interface designed for everyone, from beginners to experts.",
      },
    },
  },
  "feature-2-image": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/200x200",
        alt: "Feature 2",
        contentAlignment: "center",
      },
    },
  },
  "feature-2-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
      },
      props: {
        text: "Powerful Features",
        level: "3",
      },
    },
  },
  "feature-2-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 14,
      },
      props: {
        text: "Access advanced tools and capabilities to take your work to the next level.",
      },
    },
  },
  "feature-3-image": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        url: "https://via.placeholder.com/200x200",
        alt: "Feature 3",
        contentAlignment: "center",
      },
    },
  },
  "feature-3-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 10, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
      },
      props: {
        text: "24/7 Support",
        level: "3",
      },
    },
  },
  "feature-3-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 14,
      },
      props: {
        text: "Our dedicated team is always here to help you whenever you need assistance.",
      },
    },
  },
  cta: {
    type: "Container",
    data: {
      style: {
        padding: { top: 0, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["cta-button"],
      },
    },
  },
  "cta-button": {
    type: "Button",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
      },
      props: {
        text: "Claim Your Offer",
        url: "https://example.com/offer",
        buttonColor: "#2563EB",
        buttonTextColor: "#FFFFFF",
        fullWidth: false,
      },
    },
  },
  footer: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#F8F8F8",
      },
      props: {
        childrenIds: ["footer-text"],
      },
    },
  },
  "footer-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
      },
      props: {
        text: "© 2024 MailCrafter. All rights reserved.",
      },
    },
  },
};

/**
 * Simple Text Email Template
 */
export const simpleTextTemplate: EmailBuilderDocument = {
  backdropColor: "#F8F8F8",
  canvasColor: "#FFFFFF",
  textColor: "#242424",
  fontFamily: "MODERN_SANS",
  childrenIds: ["header", "content", "footer"],
  header: {
    type: "Container",
    data: {
      style: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["header-logo"],
      },
    },
  },
  "header-logo": {
    type: "Image",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "left",
      },
      props: {
        url: "https://via.placeholder.com/200x60",
        alt: "Logo",
        contentAlignment: "left",
      },
    },
  },
  content: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#FFFFFF",
      },
      props: {
        childrenIds: ["content-heading", "content-text"],
      },
    },
  },
  "content-heading": {
    type: "Heading",
    data: {
      style: {
        padding: { top: 0, bottom: 15, left: 0, right: 0 },
        fontSize: 24,
        fontWeight: "bold",
      },
      props: {
        text: "Important Update",
        level: "2",
      },
    },
  },
  "content-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        fontSize: 16,
      },
      props: {
        text: "This is a simple text email template. You can customize this content to match your needs. Perfect for announcements, updates, or any straightforward communication.",
      },
    },
  },
  footer: {
    type: "Container",
    data: {
      style: {
        padding: { top: 40, bottom: 40, left: 20, right: 20 },
        backgroundColor: "#F8F8F8",
      },
      props: {
        childrenIds: ["footer-text"],
      },
    },
  },
  "footer-text": {
    type: "Text",
    data: {
      style: {
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        textAlign: "center",
        fontSize: 12,
        color: "#6B7280",
      },
      props: {
        text: "© 2024 MailCrafter. All rights reserved.",
      },
    },
  },
};

/**
 * All predefined templates
 * Each template gets unique block IDs when loaded
 */
export const predefinedTemplates: PredefinedTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "A warm welcome email for new users",
    category: "Transactional",
    structure: welcomeEmailTemplate,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "A newsletter template with articles and content sections",
    category: "Marketing",
    structure: newsletterTemplate,
  },
  {
    id: "transactional",
    name: "Order Confirmation",
    description: "A transactional email for order confirmations",
    category: "Transactional",
    structure: transactionalTemplate,
  },
  {
    id: "promotional",
    name: "Promotional",
    description: "A promotional email with features and CTA",
    category: "Marketing",
    structure: promotionalTemplate,
  },
  {
    id: "simple",
    name: "Simple Text",
    description: "A simple text-only email template",
    category: "Transactional",
    structure: simpleTextTemplate,
  },
];

/**
 * Validate that a structure is complete (all referenced blocks exist)
 */
function validateStructureComplete(structure: EmailBuilderDocument, context: string = ""): boolean {
  const allKeys = Object.keys(structure);
  const blockKeys = allKeys.filter(
    (key) =>
      key !== "backdropColor" &&
      key !== "canvasColor" &&
      key !== "textColor" &&
      key !== "fontFamily" &&
      key !== "childrenIds"
  );

  const allReferencedIds = new Set<string>();
  if (structure.childrenIds) {
    structure.childrenIds.forEach((id: string) => allReferencedIds.add(id));
  }
  blockKeys.forEach((key) => {
    const block = structure[key] as any;
    if (block && typeof block === "object" && block.data?.props) {
      if (block.data.props.childrenIds && Array.isArray(block.data.props.childrenIds)) {
        block.data.props.childrenIds.forEach((id: string) => allReferencedIds.add(id));
      }
      if (block.data.props.columns && Array.isArray(block.data.props.columns)) {
        block.data.props.columns.forEach((column: any) => {
          if (column.childrenIds && Array.isArray(column.childrenIds)) {
            column.childrenIds.forEach((id: string) => allReferencedIds.add(id));
          }
        });
      }
    }
  });

  const missingIds = Array.from(allReferencedIds).filter((id) => !blockKeys.includes(id));
  if (missingIds.length > 0) {
    console.error(`[validateStructureComplete] ${context}: Structure is incomplete! Missing ${missingIds.length} blocks:`, missingIds);
    return false;
  }
  return true;
}

/**
 * Get a template with unique block IDs
 * This should be called when loading a template to ensure unique IDs
 */
export function getTemplateWithUniqueIds(templateId: string): PredefinedTemplate | undefined {
  const template = predefinedTemplates.find((t) => t.id === templateId);
  if (!template) {
    console.error(`[getTemplateWithUniqueIds] Template "${templateId}" not found`);
    return undefined;
  }

  // Deep clone the structure to prevent mutations
  const originalStructure = JSON.parse(JSON.stringify(template.structure)) as EmailBuilderDocument;
  
  // Check if structure appears to already have unique IDs (starts with template prefix)
  const firstRootChild = originalStructure.childrenIds?.[0];
  if (firstRootChild && typeof firstRootChild === 'string' && firstRootChild.startsWith(templateId + "-")) {
    console.warn(`[getTemplateWithUniqueIds] WARNING: Template "${templateId}" structure appears to already have unique IDs!`);
    console.warn(`[getTemplateWithUniqueIds] First child ID: "${firstRootChild}"`);
    console.warn(`[getTemplateWithUniqueIds] This suggests the structure was already processed. Returning as-is.`);
    // Return the template as-is if it's already processed
    return {
      ...template,
      structure: originalStructure,
    };
  }

  // Validate the original structure is complete before processing
  if (!validateStructureComplete(originalStructure, `Template "${templateId}"`)) {
    console.error(`[getTemplateWithUniqueIds] Template "${templateId}" has incomplete structure! Cannot generate unique IDs.`);
    console.error(`[getTemplateWithUniqueIds] Structure keys:`, Object.keys(originalStructure).slice(0, 20));
    return undefined;
  }

  console.log(`[getTemplateWithUniqueIds] Processing template "${templateId}" with ${Object.keys(originalStructure).length} keys`);

  return {
    ...template,
    structure: generateUniqueBlockIds(originalStructure, template.id),
  };
}

/**
 * Get a predefined template by ID
 */
export function getPredefinedTemplate(id: string): PredefinedTemplate | undefined {
  return predefinedTemplates.find((t) => t.id === id);
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: string): PredefinedTemplate[] {
  return predefinedTemplates.filter((t) => t.category === category);
}

/**
 * Get all categories
 */
export function getTemplateCategories(): string[] {
  return Array.from(new Set(predefinedTemplates.map((t) => t.category)));
}

