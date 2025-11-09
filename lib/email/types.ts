// Email Builder Types

export type BlockType =
  | "Container"
  | "Text"
  | "Heading"
  | "Button"
  | "Image"
  | "Spacer"
  | "Divider"
  | "Columns"
  | "Html";

export interface BlockStyle {
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  margin?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  backgroundColor?: string;
  textColor?: string;
  textAlign?: "left" | "center" | "right";
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontFamily?: string;
}

export interface BaseBlock {
  type: BlockType;
  id: string;
  style?: BlockStyle;
}

export interface ContainerBlock extends BaseBlock {
  type: "Container";
  props: {
    backgroundColor?: string;
    width?: number;
    childrenIds?: string[];
  };
}

export interface TextBlock extends BaseBlock {
  type: "Text";
  props: {
    text: string;
    link?: string;
  };
}

export interface HeadingBlock extends BaseBlock {
  type: "Heading";
  props: {
    text: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export interface ButtonBlock extends BaseBlock {
  type: "Button";
  props: {
    text: string;
    link: string;
    backgroundColor?: string;
    textColor?: string;
    align?: "left" | "center" | "right";
  };
}

export interface ImageBlock extends BaseBlock {
  type: "Image";
  props: {
    src: string;
    alt?: string;
    link?: string;
    width?: number;
    align?: "left" | "center" | "right";
  };
}

export interface SpacerBlock extends BaseBlock {
  type: "Spacer";
  props: {
    height: number;
  };
}

export interface DividerBlock extends BaseBlock {
  type: "Divider";
  props: {
    color?: string;
    height?: number;
  };
}

export interface ColumnsBlock extends BaseBlock {
  type: "Columns";
  props: {
    columns: number;
    childrenIds?: string[][];
  };
}

export interface HtmlBlock extends BaseBlock {
  type: "Html";
  props: {
    html: string;
  };
}

export type EmailBlock =
  | ContainerBlock
  | TextBlock
  | HeadingBlock
  | ButtonBlock
  | ImageBlock
  | SpacerBlock
  | DividerBlock
  | ColumnsBlock
  | HtmlBlock;

export interface EmailDocument {
  root: {
    type: "EmailLayout";
    data: {
      backdropColor?: string;
      canvasColor?: string;
      textColor?: string;
      fontFamily?: string;
      childrenIds: string[];
    };
  };
  [blockId: string]: EmailBlock | EmailDocument["root"];
}

export interface EmailBuilderState {
  document: EmailDocument;
  selectedBlockId: string | null;
  history: EmailDocument[];
  historyIndex: number;
}

