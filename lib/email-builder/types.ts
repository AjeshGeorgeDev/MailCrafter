/**
 * Email Builder Types - Following Phase 2 Requirements
 * Flat document structure with blocks having data.style and data.props
 */

import { z } from "zod";

// ============================================================================
// Style Schema (Common to all blocks)
// ============================================================================

export const BlockStyleSchema = z.object({
  padding: z
    .object({
      top: z.number().default(0),
      bottom: z.number().default(0),
      left: z.number().default(0),
      right: z.number().default(0),
    })
    .default({ top: 0, bottom: 0, left: 0, right: 0 })
    .optional(),
  backgroundColor: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
  fontSize: z.number().optional(),
  fontWeight: z.enum(["normal", "bold"]).default("normal"),
  textAlign: z.enum(["left", "center", "right"]).default("left"),
});

// BlockStyle type - fields with defaults are made optional for easier object creation
export type BlockStyle = {
  padding?: { top: number; bottom: number; left: number; right: number };
  backgroundColor?: string | null;
  color?: string | null;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
};

// ============================================================================
// Font Family Options
// ============================================================================

export type FontFamily =
  | "MODERN_SANS" // Arial, Helvetica, sans-serif
  | "BOOK_SERIF" // Georgia, Times, serif
  | "MONOSPACE" // Courier, monospace
  | "CLASSIC_SANS" // Verdana, Geneva, sans-serif
  | "ELEGANT_SERIF"; // "Times New Roman", Times, serif

// ============================================================================
// Root Email Layout
// ============================================================================

export const EmailLayoutSchema = z.object({
  backdropColor: z.string().default("#F8F8F8"),
  canvasColor: z.string().default("#FFFFFF"),
  textColor: z.string().default("#242424"),
  fontFamily: z
    .enum(["MODERN_SANS", "BOOK_SERIF", "MONOSPACE", "CLASSIC_SANS", "ELEGANT_SERIF"])
    .default("MODERN_SANS"),
  childrenIds: z.array(z.string()).default([]),
});

export type EmailLayout = z.infer<typeof EmailLayoutSchema>;

// ============================================================================
// Block Type Definitions
// ============================================================================

// Block 1: Text
export const TextBlockPropsSchema = z.object({
  text: z.string().default("Text content"),
});

export type TextBlockProps = z.infer<typeof TextBlockPropsSchema>;

// Block 2: Heading
export const HeadingBlockPropsSchema = z.object({
  text: z.string().default("Heading"),
  level: z.enum(["1", "2", "3", "4", "5", "6"]).default("2"),
});

export type HeadingBlockProps = z.infer<typeof HeadingBlockPropsSchema>;

// Block 3: Image
export const ImageBlockPropsSchema = z.object({
  url: z.string().default("https://via.placeholder.com/300x200"),
  alt: z.string().default(""),
  linkHref: z.string().nullable().default(null),
  width: z.number().optional(),
  height: z.number().optional(),
  contentAlignment: z.enum(["left", "center", "right"]).default("center"),
});

// ImageBlockProps type - fields with defaults are made optional for easier object creation
export type ImageBlockProps = {
  url?: string;
  alt?: string;
  linkHref?: string | null;
  width?: number;
  height?: number;
  contentAlignment?: "left" | "center" | "right";
};

// Block 4: Button
export const ButtonBlockPropsSchema = z.object({
  text: z.string().default("Click me"),
  url: z.string().default("#"),
  buttonColor: z.string().default("#2563EB"),
  buttonTextColor: z.string().default("#FFFFFF"),
  fullWidth: z.boolean().default(false),
});

export type ButtonBlockProps = z.infer<typeof ButtonBlockPropsSchema>;

// Block 5: Divider
export const DividerBlockPropsSchema = z.object({
  lineColor: z.string().default("#E5E7EB"),
  lineHeight: z.number().default(1),
});

export type DividerBlockProps = z.infer<typeof DividerBlockPropsSchema>;

// Block 6: Spacer
export const SpacerBlockPropsSchema = z.object({
  height: z.number().default(20),
});

export type SpacerBlockProps = z.infer<typeof SpacerBlockPropsSchema>;

// Block 7: Columns
export const ColumnsBlockPropsSchema = z.object({
  columns: z.array(
    z.object({
      childrenIds: z.array(z.string()).default([]),
    })
  ),
});

export type ColumnsBlockProps = z.infer<typeof ColumnsBlockPropsSchema>;

// Block 8: Container
export const ContainerBlockPropsSchema = z.object({
  childrenIds: z.array(z.string()).default([]),
});

export type ContainerBlockProps = z.infer<typeof ContainerBlockPropsSchema>;

// Block 9: Avatar
export const AvatarBlockPropsSchema = z.object({
  imageUrl: z.string().default("https://via.placeholder.com/100"),
  size: z.number().default(100),
  alt: z.string().default("Avatar"),
});

export type AvatarBlockProps = z.infer<typeof AvatarBlockPropsSchema>;

// Block 10: HTML
export const HtmlBlockPropsSchema = z.object({
  html: z.string().default("<!-- HTML content -->"),
});

export type HtmlBlockProps = z.infer<typeof HtmlBlockPropsSchema>;

// Block 11: Social Links
export const SocialLinkSchema = z.object({
  platform: z.string(),
  url: z.string(),
  icon: z.string().optional(),
});

export const SocialLinksBlockPropsSchema = z.object({
  socialLinks: z.array(SocialLinkSchema).default([]),
  iconSize: z.number().default(32),
  alignment: z.enum(["left", "center", "right"]).default("center"),
  spacing: z.number().default(12),
  iconColor: z.string().nullable().default(null),
});

// SocialLinksBlockProps type - fields with defaults are made optional for easier object creation
export type SocialLinksBlockProps = {
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
  iconSize?: number;
  alignment?: "left" | "center" | "right";
  spacing?: number;
  iconColor?: string | null;
};

// Block 12: List
export const ListBlockPropsSchema = z.object({
  items: z.array(z.string()).default(["Item 1", "Item 2", "Item 3"]),
  listType: z.enum(["ordered", "unordered"]).default("unordered"),
  bulletStyle: z.enum(["disc", "circle", "square", "decimal"]).default("disc"),
});

export type ListBlockProps = z.infer<typeof ListBlockPropsSchema>;

// Block 13: Hero
export const HeroBlockPropsSchema = z.object({
  backgroundImage: z.string().nullable().default(null),
  heading: z.string().default("Welcome"),
  subheading: z.string().default("Subheading text"),
  buttonText: z.string().nullable().default(null),
  buttonUrl: z.string().nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(0.3),
  buttonColor: z.string().default("#2563EB"),
  buttonTextColor: z.string().default("#FFFFFF"),
  textColor: z.string().nullable().default(null),
});

export type HeroBlockProps = z.infer<typeof HeroBlockPropsSchema>;

// Block 14: Quote
export const QuoteBlockPropsSchema = z.object({
  quote: z.string().default("This is a great quote!"),
  author: z.string().nullable().default(null),
  authorRole: z.string().nullable().default(null),
  quoteStyle: z.enum(["border-left", "centered", "minimal"]).default("border-left"),
  quoteColor: z.string().nullable().default(null),
  authorColor: z.string().nullable().default(null),
});

export type QuoteBlockProps = z.infer<typeof QuoteBlockPropsSchema>;

// ============================================================================
// Block Union Types
// ============================================================================

export type BlockType =
  | "Text"
  | "Heading"
  | "Image"
  | "Button"
  | "Divider"
  | "Spacer"
  | "Columns"
  | "Container"
  | "Avatar"
  | "HTML"
  | "SocialLinks"
  | "List"
  | "Hero"
  | "Quote";

export interface BaseBlock {
  type: BlockType;
  data: {
    style: BlockStyle;
    props: unknown; // Will be narrowed by block type
  };
}

export interface TextBlock extends BaseBlock {
  type: "Text";
  data: {
    style: BlockStyle;
    props: TextBlockProps;
  };
}

export interface HeadingBlock extends BaseBlock {
  type: "Heading";
  data: {
    style: BlockStyle;
    props: HeadingBlockProps;
  };
}

export interface ImageBlock extends BaseBlock {
  type: "Image";
  data: {
    style: BlockStyle;
    props: ImageBlockProps;
  };
}

export interface ButtonBlock extends BaseBlock {
  type: "Button";
  data: {
    style: BlockStyle;
    props: ButtonBlockProps;
  };
}

export interface DividerBlock extends BaseBlock {
  type: "Divider";
  data: {
    style: BlockStyle;
    props: DividerBlockProps;
  };
}

export interface SpacerBlock extends BaseBlock {
  type: "Spacer";
  data: {
    style: BlockStyle;
    props: SpacerBlockProps;
  };
}

export interface ColumnsBlock extends BaseBlock {
  type: "Columns";
  data: {
    style: BlockStyle;
    props: ColumnsBlockProps;
  };
}

export interface ContainerBlock extends BaseBlock {
  type: "Container";
  data: {
    style: BlockStyle;
    props: ContainerBlockProps;
  };
}

export interface AvatarBlock extends BaseBlock {
  type: "Avatar";
  data: {
    style: BlockStyle;
    props: AvatarBlockProps;
  };
}

export interface HtmlBlock extends BaseBlock {
  type: "HTML";
  data: {
    style: BlockStyle;
    props: HtmlBlockProps;
  };
}

export interface SocialLinksBlock extends BaseBlock {
  type: "SocialLinks";
  data: {
    style: BlockStyle;
    props: SocialLinksBlockProps;
  };
}

export interface ListBlock extends BaseBlock {
  type: "List";
  data: {
    style: BlockStyle;
    props: ListBlockProps;
  };
}

export interface HeroBlock extends BaseBlock {
  type: "Hero";
  data: {
    style: BlockStyle;
    props: HeroBlockProps;
  };
}

export interface QuoteBlock extends BaseBlock {
  type: "Quote";
  data: {
    style: BlockStyle;
    props: QuoteBlockProps;
  };
}

export type EmailBlock =
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock
  | ContainerBlock
  | AvatarBlock
  | HtmlBlock
  | SocialLinksBlock
  | ListBlock
  | HeroBlock
  | QuoteBlock;

// ============================================================================
// Document Structure (Flat - blocks stored as object with blockId as key)
// ============================================================================

export interface EmailBuilderDocument {
  backdropColor: string;
  canvasColor: string;
  textColor: string;
  fontFamily: FontFamily;
  childrenIds: string[]; // Top-level block IDs
  [blockId: string]: EmailBlock | string | FontFamily | string[]; // Allow blockId keys
}

// ============================================================================
// Full Document Schema Validation
// ============================================================================

// Schema for individual block validation (will be created per block type)
export const createBlockSchema = (type: BlockType) => {
  const baseBlockSchema = z.object({
    type: z.literal(type),
    data: z.object({
      style: BlockStyleSchema,
      props: z.unknown(),
    }),
  });

  switch (type) {
    case "Text":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: TextBlockPropsSchema,
        }),
      });
    case "Heading":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: HeadingBlockPropsSchema,
        }),
      });
    case "Image":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: ImageBlockPropsSchema,
        }),
      });
    case "Button":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: ButtonBlockPropsSchema,
        }),
      });
    case "Divider":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: DividerBlockPropsSchema,
        }),
      });
    case "Spacer":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: SpacerBlockPropsSchema,
        }),
      });
    case "Columns":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: ColumnsBlockPropsSchema,
        }),
      });
    case "Container":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: ContainerBlockPropsSchema,
        }),
      });
    case "Avatar":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: AvatarBlockPropsSchema,
        }),
      });
    case "HTML":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: HtmlBlockPropsSchema,
        }),
      });
    case "SocialLinks":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: SocialLinksBlockPropsSchema,
        }),
      });
    case "List":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: ListBlockPropsSchema,
        }),
      });
    case "Hero":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: HeroBlockPropsSchema,
        }),
      });
    case "Quote":
      return baseBlockSchema.extend({
        data: z.object({
          style: BlockStyleSchema,
          props: QuoteBlockPropsSchema,
        }),
      });
    default:
      return baseBlockSchema;
  }
};

export const EmailBuilderDocumentSchema = z.object({
  backdropColor: z.string(),
  canvasColor: z.string(),
  textColor: z.string(),
  fontFamily: z.enum(["MODERN_SANS", "BOOK_SERIF", "MONOSPACE", "CLASSIC_SANS", "ELEGANT_SERIF"]),
  childrenIds: z.array(z.string()),
}).passthrough(); // Allow additional blockId keys

