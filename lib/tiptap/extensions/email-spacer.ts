/**
 * TipTap Email Spacer Extension
 * Custom node for email spacing
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface SpacerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emailSpacer: {
      /**
       * Insert an email spacer
       */
      setEmailSpacer: (options: { height?: number }) => ReturnType;
    };
  }
}

export const EmailSpacer = Node.create<SpacerOptions>({
  name: "emailSpacer",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "",

  addAttributes() {
    return {
      height: {
        default: 20,
        parseHTML: (element) => parseInt(element.getAttribute("data-height") || "20", 10),
        renderHTML: (attributes) => {
          return {
            "data-height": attributes.height || 20,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="email-spacer"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const height = node.attrs.height || 20;

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "email-spacer",
        style: `height: ${height}px; line-height: ${height}px; font-size: 1px; background: repeating-linear-gradient(45deg, transparent, transparent 5px, #f0f0f0 5px, #f0f0f0 10px); position: relative; cursor: pointer;`,
        "contenteditable": "false",
      }),
      [
        "div",
        {
          style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #999; white-space: nowrap;",
        },
        `${height}px spacer`,
      ],
    ];
  },

  addCommands() {
    return {
      setEmailSpacer:
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

