/**
 * TipTap Email Button Extension
 * Custom node for email button component
 */

import { Node, mergeAttributes } from "@tiptap/core";

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    emailButton: {
      /**
       * Insert an email button
       */
      setEmailButton: (options: {
        text?: string;
        link?: string;
        backgroundColor?: string;
        textColor?: string;
        align?: "left" | "center" | "right";
      }) => ReturnType;
    };
  }
}

export const EmailButton = Node.create<ButtonOptions>({
  name: "emailButton",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  content: "",

  addAttributes() {
    return {
      text: {
        default: "Click me",
        parseHTML: (element) => element.getAttribute("data-text"),
        renderHTML: (attributes) => {
          if (!attributes.text) {
            return {};
          }
          return {
            "data-text": attributes.text,
          };
        },
      },
      link: {
        default: "#",
        parseHTML: (element) => element.getAttribute("data-link"),
        renderHTML: (attributes) => {
          if (!attributes.link) {
            return {};
          }
          return {
            "data-link": attributes.link,
          };
        },
      },
      backgroundColor: {
        default: "#007bff",
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
      textColor: {
        default: "#ffffff",
        parseHTML: (element) => element.getAttribute("data-text-color"),
        renderHTML: (attributes) => {
          if (!attributes.textColor) {
            return {};
          }
          return {
            "data-text-color": attributes.textColor,
          };
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align"),
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {};
          }
          return {
            "data-align": attributes.align,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="email-button"]',
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const wrapper = element as HTMLElement;
          const link = wrapper.querySelector("a");
          return {
            text: link?.textContent || "Click me",
            link: link?.getAttribute("href") || "#",
            backgroundColor: link?.style.backgroundColor || "#007bff",
            textColor: link?.style.color || "#ffffff",
            align: wrapper.style.textAlign || "center",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { text, link, backgroundColor, textColor, align } = node.attrs;

    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "email-button",
        class: "email-button-wrapper",
        style: `text-align: ${align || "center"}; padding: 16px 24px;`,
      }),
      [
        "a",
        {
          href: link || "#",
          class: "email-button",
          style: `display: inline-block; padding: 12px 24px; background-color: ${backgroundColor || "#007bff"}; color: ${textColor || "#ffffff"}; text-decoration: none; border-radius: 4px; font-weight: bold; cursor: pointer;`,
          contenteditable: "false",
        },
        text || "Click me",
      ],
    ];
  },

  addCommands() {
    return {
      setEmailButton:
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

