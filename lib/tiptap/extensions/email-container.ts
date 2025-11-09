/**
 * TipTap Email Container Extension
 * Custom node for email container (supports nested blocks)
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface ContainerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emailContainer: {
      /**
       * Insert an email container
       */
      setEmailContainer: (options: { backgroundColor?: string }) => ReturnType;
    };
  }
}

export const EmailContainer = Node.create<ContainerOptions>({
  name: "emailContainer",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      backgroundColor: {
        default: "transparent",
        parseHTML: (element) => element.getAttribute("data-bg-color"),
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) {
            return {};
          }
          return {
            "data-bg-color": attributes.backgroundColor,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="email-container"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const backgroundColor = node.attrs.backgroundColor || "transparent";

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "email-container",
        style: `border: 2px solid #e0e0e0; border-radius: 4px; padding: 16px; background-color: ${backgroundColor}; min-height: 100px;`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setEmailContainer:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Drop blocks here" }],
              },
            ],
          });
        },
    };
  },
});

