/**
 * Block Definitions - Default values and factories
 * Following Phase 6 requirements
 */

import { v4 as uuidv4 } from "uuid";
import type {
  EmailBlock,
  BlockType,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  ColumnsBlock,
  ContainerBlock,
  AvatarBlock,
  HtmlBlock,
  SocialLinksBlock,
  ListBlock,
  HeroBlock,
  QuoteBlock,
  BlockStyle,
} from "./types";

// ============================================================================
// Default Style Values
// ============================================================================

export const getDefaultStyle = (): BlockStyle => ({
  padding: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  backgroundColor: null,
  color: null,
  fontSize: undefined,
  fontWeight: "normal",
  textAlign: "left",
});

// ============================================================================
// Block Default Values
// ============================================================================

export const getDefaultValues = (type: BlockType): EmailBlock => {
  const defaultStyle = getDefaultStyle();

  switch (type) {
    case "Text":
      return {
        type: "Text",
        data: {
          style: defaultStyle,
          props: {
            text: "Text content",
          },
        },
      } as TextBlock;

    case "Heading":
      return {
        type: "Heading",
        data: {
          style: {
            ...defaultStyle,
            fontSize: 24,
            fontWeight: "bold",
          },
          props: {
            text: "Heading",
            level: "2",
          },
        },
      } as HeadingBlock;

    case "Image":
      return {
        type: "Image",
        data: {
          style: defaultStyle,
          props: {
            url: "https://via.placeholder.com/300x200",
            alt: "",
            linkHref: null,
            width: undefined,
            height: undefined,
            contentAlignment: "center",
          },
        },
      } as ImageBlock;

    case "Button":
      return {
        type: "Button",
        data: {
          style: {
            ...defaultStyle,
            textAlign: "center",
            padding: {
              top: 12,
              bottom: 12,
              left: 24,
              right: 24,
            },
          },
          props: {
            text: "Click me",
            url: "#",
            buttonColor: "#2563EB",
            buttonTextColor: "#FFFFFF",
            fullWidth: false,
          },
        },
      } as ButtonBlock;

    case "Divider":
      return {
        type: "Divider",
        data: {
          style: {
            ...defaultStyle,
            padding: {
              top: 20,
              bottom: 20,
              left: 0,
              right: 0,
            },
          },
          props: {
            lineColor: "#E5E7EB",
            lineHeight: 1,
          },
        },
      } as DividerBlock;

    case "Spacer":
      return {
        type: "Spacer",
        data: {
          style: defaultStyle,
          props: {
            height: 20,
          },
        },
      } as SpacerBlock;

    case "Columns":
      return {
        type: "Columns",
        data: {
          style: defaultStyle,
          props: {
            columns: [
              { childrenIds: [] },
              { childrenIds: [] },
            ],
          },
        },
      } as ColumnsBlock;

    case "Container":
      return {
        type: "Container",
        data: {
          style: {
            ...defaultStyle,
            backgroundColor: "#F3F4F6",
            padding: {
              top: 20,
              bottom: 20,
              left: 20,
              right: 20,
            },
          },
          props: {
            childrenIds: [],
          },
        },
      } as ContainerBlock;

    case "Avatar":
      return {
        type: "Avatar",
        data: {
          style: {
            ...defaultStyle,
            textAlign: "center",
          },
          props: {
            imageUrl: "https://via.placeholder.com/100",
            size: 100,
            alt: "Avatar",
          },
        },
      } as AvatarBlock;

    case "HTML":
      return {
        type: "HTML",
        data: {
          style: defaultStyle,
          props: {
            html: "<!-- HTML content -->",
          },
        },
      } as HtmlBlock;

    case "SocialLinks":
      return {
        type: "SocialLinks",
        data: {
          style: {
            ...defaultStyle,
            textAlign: "center",
            padding: {
              top: 20,
              bottom: 20,
              left: 0,
              right: 0,
            },
          },
          props: {
            socialLinks: [
              { platform: "Facebook", url: "#", icon: "facebook" },
              { platform: "Twitter", url: "#", icon: "twitter" },
              { platform: "Instagram", url: "#", icon: "instagram" },
            ],
            iconSize: 32,
            alignment: "center",
            spacing: 12,
            iconColor: null,
          },
        },
      } as SocialLinksBlock;

    case "List":
      return {
        type: "List",
        data: {
          style: defaultStyle,
          props: {
            items: ["Item 1", "Item 2", "Item 3"],
            listType: "unordered",
            bulletStyle: "disc",
          },
        },
      } as ListBlock;

    case "Hero":
      return {
        type: "Hero",
        data: {
          style: {
            ...defaultStyle,
            textAlign: "center",
            padding: {
              top: 60,
              bottom: 60,
              left: 20,
              right: 20,
            },
          },
          props: {
            backgroundImage: null,
            heading: "Welcome",
            subheading: "Subheading text",
            buttonText: "Get Started",
            buttonUrl: "#",
            overlayOpacity: 0.3,
            buttonColor: "#2563EB",
            buttonTextColor: "#FFFFFF",
            textColor: null,
          },
        },
      } as HeroBlock;

    case "Quote":
      return {
        type: "Quote",
        data: {
          style: {
            ...defaultStyle,
            padding: {
              top: 20,
              bottom: 20,
              left: 20,
              right: 20,
            },
          },
          props: {
            quote: "This is a great quote!",
            author: "John Doe",
            authorRole: "CEO, Company Name",
            quoteStyle: "border-left",
            quoteColor: null,
            authorColor: null,
          },
        },
      } as QuoteBlock;

    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

// ============================================================================
// Block Factory Function
// ============================================================================

/**
 * Creates a new block with unique ID and default values
 * Note: The ID is not part of the block itself - it's the key in the document
 */
export const createBlock = (type: BlockType): EmailBlock => {
  return getDefaultValues(type);
};

/**
 * Generates a unique block ID
 */
export const generateBlockId = (): string => {
  return `block-${uuidv4()}`;
};

// ============================================================================
// Block Registry - Metadata for UI
// ============================================================================

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string; // Icon name or emoji for now
  category: "Layout" | "Content" | "Media";
  description: string;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "Text",
    label: "Text",
    icon: "📝",
    category: "Content",
    description: "Add text content with basic HTML formatting",
  },
  {
    type: "Heading",
    label: "Heading",
    icon: "📰",
    category: "Content",
    description: "Add a heading (H1-H6)",
  },
  {
    type: "Image",
    label: "Image",
    icon: "🖼️",
    category: "Media",
    description: "Add an image with optional link",
  },
  {
    type: "Button",
    label: "Button",
    icon: "🔘",
    category: "Content",
    description: "Add a call-to-action button",
  },
  {
    type: "Divider",
    label: "Divider",
    icon: "➖",
    category: "Layout",
    description: "Add a horizontal divider line",
  },
  {
    type: "Spacer",
    label: "Spacer",
    icon: "📏",
    category: "Layout",
    description: "Add vertical spacing",
  },
  {
    type: "Columns",
    label: "Columns",
    icon: "📊",
    category: "Layout",
    description: "Create a multi-column layout (2-4 columns)",
  },
  {
    type: "Container",
    label: "Container",
    icon: "📦",
    category: "Layout",
    description: "Wrap blocks in a container with background",
  },
  {
    type: "Avatar",
    label: "Avatar",
    icon: "👤",
    category: "Media",
    description: "Add a circular profile image",
  },
  {
    type: "HTML",
    label: "HTML",
    icon: "⚙️",
    category: "Content",
    description: "Add custom HTML (advanced)",
  },
  {
    type: "SocialLinks",
    label: "Social Links",
    icon: "🔗",
    category: "Content",
    description: "Add social media links with icons",
  },
  {
    type: "List",
    label: "List",
    icon: "📋",
    category: "Content",
    description: "Add ordered or unordered list",
  },
  {
    type: "Hero",
    label: "Hero",
    icon: "🎯",
    category: "Layout",
    description: "Add a hero banner with heading, text, and button",
  },
  {
    type: "Quote",
    label: "Quote",
    icon: "💬",
    category: "Content",
    description: "Add a styled quote or testimonial",
  },
];

export const getBlockDefinition = (type: BlockType): BlockDefinition => {
  const definition = BLOCK_DEFINITIONS.find((def) => def.type === type);
  if (!definition) {
    throw new Error(`Block definition not found for type: ${type}`);
  }
  return definition;
};

export const getBlocksByCategory = () => {
  const categories: Record<string, BlockDefinition[]> = {
    Layout: [],
    Content: [],
    Media: [],
  };

  BLOCK_DEFINITIONS.forEach((def) => {
    categories[def.category].push(def);
  });

  return categories;
};

