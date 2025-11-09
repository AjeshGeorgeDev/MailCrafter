/**
 * TipTap Email Divider Extension
 * Custom node for email divider/separator
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface DividerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emailDivider: {
      /**
       * Insert an email divider
       */
      setEmailDivider: (options: { color?: string; height?: number }) => ReturnType;
    };
  }
}

export const EmailDivider = Node.create<DividerOptions>({
  name: "emailDivider",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "",

  addAttributes() {
    return {
      color: {
        default: "#e0e0e0",
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => {
          return {
            "data-color": attributes.color || "#e0e0e0",
          };
        },
      },
      height: {
        default: 1,
        parseHTML: (element) => parseInt(element.getAttribute("data-height") || "1", 10),
        renderHTML: (attributes) => {
          return {
            "data-height": attributes.height || 1,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="email-divider"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { color, height } = node.attrs;

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "email-divider",
        style: `padding: 20px 0; text-align: center; position: relative; cursor: pointer;`,
        "contenteditable": "false",
      }),
      [
        "hr",
        {
          style: `border: none; border-top: ${height || 1}px solid ${color || "#e0e0e0"}; margin: 0; width: 100%;`,
        },
      ],
      [
        "div",
        {
          style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2px 6px; font-size: 11px; color: #999;",
        },
        "Divider",
      ],
    ];
  },

  addCommands() {
    return {
      setEmailDivider:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

