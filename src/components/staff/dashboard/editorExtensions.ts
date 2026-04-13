import { Mark, mergeAttributes } from "@tiptap/core";

function isHTMLElement(node: unknown): node is HTMLElement {
  return node instanceof HTMLElement;
}

export const UnderlineMark = Mark.create({
  name: "underline",

  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        getAttrs: (value) => {
          if (typeof value !== "string") {
            return false;
          }

          return value.includes("underline") ? {} : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
});

export const TextStyleMark = Mark.create({
  name: "textStyle",

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (node) => {
          if (!isHTMLElement(node)) {
            return false;
          }

          const color = node.style.color?.trim();
          return color ? { color } : false;
        },
      },
    ];
  },

  addAttributes() {
    return {
      color: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { color, style, ...rest } = HTMLAttributes as {
      color?: string | null;
      style?: string;
    };

    const inlineStyles: string[] = [];

    if (typeof style === "string" && style.trim()) {
      inlineStyles.push(style.trim().replace(/;$/, ""));
    }

    if (typeof color === "string" && color.trim()) {
      inlineStyles.push(`color: ${color.trim()}`);
    }

    return [
      "span",
      mergeAttributes(rest, {
        style: inlineStyles.length > 0 ? `${inlineStyles.join("; ")};` : undefined,
      }),
      0,
    ];
  },
});

export const LinkMark = Mark.create({
  name: "link",

  inclusive: false,

  parseHTML() {
    return [
      {
        tag: "a[href]",
        getAttrs: (node) => {
          if (!isHTMLElement(node)) {
            return false;
          }

          const href = node.getAttribute("href")?.trim();

          if (!href) {
            return false;
          }

          return {
            href,
            target: node.getAttribute("target") || "_blank",
            rel: node.getAttribute("rel") || "noopener noreferrer",
          };
        },
      },
    ];
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: "_blank",
      },
      rel: {
        default: "noopener noreferrer",
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes), 0];
  },
});
