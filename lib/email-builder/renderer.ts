/**
 * Email HTML Renderer
 * Converts EmailBuilderDocument to email-safe HTML
 * Following Phase 7 requirements - table-based layouts, inline styles, Outlook support
 */

import type {
  EmailBuilderDocument,
  EmailBlock,
  FontFamily,
} from "./types";

// ============================================================================
// Font Family Mapping
// ============================================================================

const FONT_FAMILIES: Record<FontFamily, string> = {
  MODERN_SANS: "Arial, Helvetica, sans-serif",
  BOOK_SERIF: "Georgia, Times, serif",
  MONOSPACE: "Courier, monospace",
  CLASSIC_SANS: "Verdana, Geneva, sans-serif",
  ELEGANT_SERIF: '"Times New Roman", Times, serif',
};

// ============================================================================
// Helper Functions
// ============================================================================

function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");
  
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

function formatColor(color: string | null | undefined): string {
  if (!color) return "";
  // Ensure 6-digit hex
  if (color.startsWith("#") && color.length === 4) {
    color = "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  return color;
}

function buildInlineStyles(styles: {
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  backgroundColor?: string | null;
  color?: string | null;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
}): string {
  const parts: string[] = [];
  
  if (styles.padding) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = styles.padding;
    if (top === right && right === bottom && bottom === left) {
      parts.push(`padding: ${top}px`);
    } else {
      parts.push(`padding: ${top}px ${right}px ${bottom}px ${left}px`);
    }
  }
  
  if (styles.backgroundColor) {
    parts.push(`background-color: ${formatColor(styles.backgroundColor)}`);
  }
  
  if (styles.color) {
    parts.push(`color: ${formatColor(styles.color)}`);
  }
  
  if (styles.fontSize) {
    parts.push(`font-size: ${styles.fontSize}px`);
  }
  
  if (styles.fontWeight) {
    parts.push(`font-weight: ${styles.fontWeight}`);
  }
  
  if (styles.textAlign) {
    parts.push(`text-align: ${styles.textAlign}`);
  }
  
  return parts.join("; ");
}

// ============================================================================
// Block Renderers
// ============================================================================

function renderTextBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "Text") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  
  const inlineStyles = buildInlineStyles(style);
  const fullStyles = `${inlineStyles}; font-family: ${fontFamily};`.replace(/^; /, "");
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${fullStyles}">
          ${props.text || "&nbsp;"}
        </td>
      </tr>
    </table>
  `;
}

function renderHeadingBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "Heading") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  const level = parseInt(props.level || "2");
  const tag = `h${level}`;
  
  const inlineStyles = buildInlineStyles(style);
  const fullStyles = `${inlineStyles}; font-family: ${fontFamily}; margin: 0;`.replace(/^; /, "");
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${fullStyles}">
          <${tag} style="${fullStyles} margin: 0; padding: 0;">
            ${props.text || "&nbsp;"}
          </${tag}>
        </td>
      </tr>
    </table>
  `;
}

function renderImageBlock(block: EmailBlock): string {
  if (block.type !== "Image") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles({
    ...style,
    textAlign: props.contentAlignment || style.textAlign,
  });
  
  let imageStyles = `display: block; max-width: 100%; height: auto;`;
  if (props.width) {
    imageStyles += ` width: ${props.width}px;`;
  }
  if (props.height) {
    imageStyles += ` height: ${props.height}px;`;
  }
  
  const imageTag = `<img src="${props.url || ""}" alt="${props.alt || ""}" style="${imageStyles}"${props.width ? ` width="${props.width}"` : ""}${props.height ? ` height="${props.height}"` : ""} />`;
  
  const content = props.linkHref
    ? `<a href="${props.linkHref}" style="text-decoration: none;">${imageTag}</a>`
    : imageTag;
  
  const alignAttr = props.contentAlignment === "center" ? ' align="center"' : props.contentAlignment === "right" ? ' align="right"' : '';
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}"${alignAttr}>
          ${content}
        </td>
      </tr>
    </table>
  `;
}

function renderButtonBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "Button") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  
  const containerStyles = buildInlineStyles({
    ...style,
    textAlign: "center",
  });
  
  const buttonColor = formatColor(props.buttonColor || "#2563EB");
  const buttonTextColor = formatColor(props.buttonTextColor || "#FFFFFF");
  const buttonColorRgb = hexToRgb(buttonColor);
  
  // Outlook VML version
  const vmlButton = `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" 
      href="${props.url || "#"}" 
      style="height:40px;v-text-anchor:middle;width:${props.fullWidth ? '100%' : '200px'};" 
      arcsize="10%" 
      strokecolor="${buttonColor}" 
      fillcolor="${buttonColor}">
      <w:anchorlock/>
      <center style="color:${buttonTextColor};font-family:${fontFamily};font-size:16px;font-weight:bold;">
        ${props.text || "Button"}
      </center>
    </v:roundrect>
    <![endif]-->
  `;
  
  // HTML version for other clients
  const htmlButton = `
    <!--[if !mso]><!-->
    <a href="${props.url || "#"}" 
       style="background-color: ${buttonColor}; color: ${buttonTextColor}; font-family: ${fontFamily}; display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; ${props.fullWidth ? 'width: 100%;' : ''}"
       class="mso-hide">
      ${props.text || "Button"}
    </a>
    <!--<![endif]-->
  `;
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}" align="center">
          ${vmlButton}
          ${htmlButton}
        </td>
      </tr>
    </table>
  `;
}

function renderDividerBlock(block: EmailBlock): string {
  if (block.type !== "Divider") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles(style);
  const lineColor = formatColor(props.lineColor || "#E5E7EB");
  const lineHeight = props.lineHeight || 1;
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="border-top: ${lineHeight}px solid ${lineColor}; height: ${lineHeight}px; line-height: ${lineHeight}px; font-size: 1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderSpacerBlock(block: EmailBlock): string {
  if (block.type !== "Spacer") return "";
  
  const props = block.data.props;
  const height = props.height || 20;
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</td>
      </tr>
    </table>
  `;
}

function renderContainerBlock(
  block: EmailBlock,
  document: EmailBuilderDocument,
  renderBlock: (blockId: string) => string
): string {
  if (block.type !== "Container") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles({
    ...style,
    backgroundColor: style.backgroundColor || (props as any).backgroundColor || undefined,
  });
  
  const bgcolor = style.backgroundColor || (props as any).backgroundColor || "";
  const bgcolorAttr = bgcolor ? ` bgcolor="${formatColor(bgcolor)}"` : "";
  
  const childrenHtml = props.childrenIds
    .map((childId) => renderBlock(childId))
    .join("");
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}"${bgcolorAttr}>
          ${childrenHtml || "&nbsp;"}
        </td>
      </tr>
    </table>
  `;
}

function renderColumnsBlock(
  block: EmailBlock,
  document: EmailBuilderDocument,
  renderBlock: (blockId: string) => string
): string {
  if (block.type !== "Columns") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles(style);
  const numColumns = props.columns.length;
  const columnWidth = Math.floor(100 / numColumns);
  
  const columnHtml = props.columns.map((column, index) => {
    const childrenHtml = column.childrenIds
      .map((childId) => renderBlock(childId))
      .join("");
    
    return `
      <!--[if mso]>
      <td width="${columnWidth}%" valign="top" style="padding: 0 10px;">
        ${childrenHtml || "&nbsp;"}
      </td>
      <![endif]-->
      <!--[if !mso]><!-->
      <td width="${columnWidth}%" valign="top" style="padding: 0 10px; display: inline-block; vertical-align: top; max-width: ${600 / numColumns}px;">
        ${childrenHtml || "&nbsp;"}
      </td>
      <!--<![endif]-->
    `;
  }).join("");
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="ltr">
            <tr>
              ${columnHtml}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderAvatarBlock(block: EmailBlock): string {
  if (block.type !== "Avatar") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles({
    ...style,
    textAlign: "center",
  });
  
  const size = props.size || 100;
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}" align="center">
          <img src="${props.imageUrl || ""}" 
               alt="${props.alt || "Avatar"}" 
               width="${size}" 
               height="${size}"
               style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; display: block; max-width: 100%;" />
        </td>
      </tr>
    </table>
  `;
}

function renderHtmlBlock(block: EmailBlock): string {
  if (block.type !== "HTML") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles(style);
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}">
          ${props.html || "&nbsp;"}
        </td>
      </tr>
    </table>
  `;
}

function renderSocialLinksBlock(block: EmailBlock): string {
  if (block.type !== "SocialLinks") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  
  const containerStyles = buildInlineStyles({
    ...style,
    textAlign: props.alignment || style.textAlign,
  });
  
  const iconSize = props.iconSize || 32;
  const spacing = props.spacing || 12;
  const iconColor = formatColor(props.iconColor || "#6B7280");
  
  // Simple social links using text/icons (email-safe)
  const links = props.socialLinks || [];
  const linksHtml = links.map((link, index) => {
    const platform = link.platform || "Link";
    const url = link.url || "#";
    return `
      <a href="${url}" style="display: inline-block; margin: 0 ${index < links.length - 1 ? spacing / 2 : 0}px ${index < links.length - 1 ? spacing / 2 : 0}px 0; color: ${iconColor}; text-decoration: none; font-size: ${iconSize * 0.6}px; line-height: ${iconSize}px; width: ${iconSize}px; height: ${iconSize}px; text-align: center; border: 1px solid ${iconColor}; border-radius: 50%;">
        ${platform.charAt(0)}
      </a>
    `;
  }).join("");
  
  const alignAttr = props.alignment === "center" ? ' align="center"' : props.alignment === "right" ? ' align="right"' : '';
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles}"${alignAttr}>
          ${linksHtml || "&nbsp;"}
        </td>
      </tr>
    </table>
  `;
}

function renderListBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "List") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  
  const containerStyles = buildInlineStyles(style);
  const fullStyles = `${containerStyles}; font-family: ${fontFamily};`.replace(/^; /, "");
  
  const items = props.items || [];
  const listType = props.listType || "unordered";
  const bulletStyle = props.bulletStyle || "disc";
  
  const listStyle = listType === "unordered" 
    ? `list-style-type: ${bulletStyle === "disc" ? "disc" : bulletStyle === "circle" ? "circle" : "square"};`
    : `list-style-type: ${bulletStyle === "decimal" ? "decimal" : "decimal"};`;
  
  const Tag = listType === "ordered" ? "ol" : "ul";
  
  const itemsHtml = items.map((item, index) => 
    `<li style="margin-bottom: 4px;">${item || "&nbsp;"}</li>`
  ).join("");
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${fullStyles}">
          <${Tag} style="margin: 0; padding-left: 24px; ${listStyle}">
            ${itemsHtml || "<li>&nbsp;</li>"}
          </${Tag}>
        </td>
      </tr>
    </table>
  `;
}

function renderHeroBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "Hero") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  
  const containerStyles = buildInlineStyles({
    ...style,
    textAlign: "center",
  });
  
  const textColor = formatColor(props.textColor || document.textColor || "#242424");
  const overlayOpacity = props.overlayOpacity || 0.3;
  const overlayColor = `rgba(0, 0, 0, ${overlayOpacity})`;
  
  const backgroundStyle = props.backgroundImage
    ? `background-image: url(${props.backgroundImage}); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : "";
  
  const headingHtml = props.heading 
    ? `<h1 style="margin: 0 0 16px 0; padding: 0; font-size: 32px; font-weight: bold; color: ${textColor}; font-family: ${fontFamily};">
        ${props.heading}
      </h1>`
    : "";
  
  const subheadingHtml = props.subheading
    ? `<p style="margin: 0 0 24px 0; padding: 0; font-size: 18px; color: ${textColor}; font-family: ${fontFamily};">
        ${props.subheading}
      </p>`
    : "";
  
  const buttonColor = formatColor(props.buttonColor || "#2563EB");
  const buttonTextColor = formatColor(props.buttonTextColor || "#FFFFFF");
  const buttonColorRgb = hexToRgb(buttonColor);
  
  const buttonHtml = props.buttonText && props.buttonUrl
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 12px 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${props.buttonUrl}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fill="t">
              <v:fill type="tile" color="${buttonColor}" />
              <w:anchorlock/>
              <center style="color:${buttonTextColor};font-family:${fontFamily};font-size:16px;font-weight:bold;">${props.buttonText}</center>
            </v:roundrect>
            <![endif]-->
            <a href="${props.buttonUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${buttonColor}; color: ${buttonTextColor}; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: ${fontFamily}; font-size: 16px;">${props.buttonText}</a>
          </td>
        </tr>
      </table>
    `
    : "";
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${containerStyles} ${backgroundStyle} position: relative; min-height: 200px;" bgcolor="${props.backgroundImage ? '' : formatColor(style.backgroundColor || '#FFFFFF')}">
          ${props.backgroundImage ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: ${overlayColor};"></div>` : ''}
          <div style="position: relative; z-index: 1; max-width: 600px; margin: 0 auto; padding: 0 20px;">
            ${headingHtml}
            ${subheadingHtml}
            ${buttonHtml}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function renderQuoteBlock(block: EmailBlock, document: EmailBuilderDocument): string {
  if (block.type !== "Quote") return "";
  
  const props = block.data.props;
  const style = block.data.style;
  const fontFamily = FONT_FAMILIES[document.fontFamily];
  
  const quoteStyle = props.quoteStyle || "border-left";
  const quoteColor = formatColor(props.quoteColor || document.textColor || "#242424");
  const authorColor = formatColor(props.authorColor || "#6B7280");
  
  let containerStyles = buildInlineStyles(style);
  
  if (quoteStyle === "border-left") {
    const borderColor = formatColor(props.quoteColor || "#2563EB");
    containerStyles += ` border-left: 4px solid ${borderColor}; padding-left: 20px;`;
  } else if (quoteStyle === "centered") {
    containerStyles += ` text-align: center;`;
  }
  
  const fullStyles = `${containerStyles}; font-family: ${fontFamily};`.replace(/^; /, "");
  
  const quoteHtml = props.quote
    ? `<p style="margin: 0 0 ${props.author ? '12px' : '0'} 0; padding: 0; font-size: ${quoteStyle === 'centered' ? '20px' : '18px'}; font-style: italic; color: ${quoteColor}; font-family: ${fontFamily};">
        "${props.quote}"
      </p>`
    : "";
  
  const authorHtml = props.author
    ? `<p style="margin: 0; padding: 0; font-size: 14px; color: ${authorColor}; font-family: ${fontFamily};">
        <strong>${props.author}</strong>${props.authorRole ? ` — ${props.authorRole}` : ''}
      </p>`
    : "";
  
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="${fullStyles}">
          ${quoteHtml}
          ${authorHtml}
        </td>
      </tr>
    </table>
  `;
}

// ============================================================================
// Main Renderer Function
// ============================================================================

/**
 * Renders EmailBuilderDocument to email-safe HTML
 */
export function renderToStaticMarkup(document: EmailBuilderDocument): string {
  const backdropColor = formatColor(document.backdropColor || "#F8F8F8");
  const canvasColor = formatColor(document.canvasColor || "#FFFFFF");
  const textColor = formatColor(document.textColor || "#242424");
  const fontFamily = FONT_FAMILIES[document.fontFamily || "MODERN_SANS"];
  
  // Recursive block renderer
  const renderBlock = (blockId: string): string => {
    const block = document[blockId] as EmailBlock | undefined;
    if (!block) return "";
    
    switch (block.type) {
      case "Text":
        return renderTextBlock(block, document);
      case "Heading":
        return renderHeadingBlock(block, document);
      case "Image":
        return renderImageBlock(block);
      case "Button":
        return renderButtonBlock(block, document);
      case "Divider":
        return renderDividerBlock(block);
      case "Spacer":
        return renderSpacerBlock(block);
      case "Container":
        return renderContainerBlock(block, document, renderBlock);
      case "Columns":
        return renderColumnsBlock(block, document, renderBlock);
      case "Avatar":
        return renderAvatarBlock(block);
      case "HTML":
        return renderHtmlBlock(block);
      case "SocialLinks":
        return renderSocialLinksBlock(block);
      case "List":
        return renderListBlock(block, document);
      case "Hero":
        return renderHeroBlock(block, document);
      case "Quote":
        return renderQuoteBlock(block, document);
      default:
        return "";
    }
  };
  
  // Render all root children
  const bodyContent = document.childrenIds
    .map((blockId) => renderBlock(blockId))
    .join("");
  
  // Build full HTML document
  return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Template</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: ${fontFamily} !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    
    /* Mobile Styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-container table {
        width: 100% !important;
      }
      .email-container .column {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${backdropColor}; font-family: ${fontFamily}; color: ${textColor};">
  <!-- Outer table for backdrop -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${backdropColor}">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Email body container (600px max width) -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="${canvasColor}" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td>
              ${bodyContent || "&nbsp;"}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

