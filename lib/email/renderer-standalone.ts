/**
 * Standalone Email Renderer
 * Converts EmailDocument to HTML suitable for email clients
 */

import { EmailDocument, EmailBlock } from "./types";

export function renderToStaticMarkup(
  document: EmailDocument,
  options: { rootBlockId?: string } = {}
): string {
  const root = document.root;
  const rootBlockId = options.rootBlockId || "root";
  
  // Build email-safe HTML
  const backdropColor = root.data.backdropColor || "#F8F8F8";
  const canvasColor = root.data.canvasColor || "#FFFFFF";
  const textColor = root.data.textColor || "#242424";
  const fontFamily = mapFontFamily(root.data.fontFamily);

  const childrenHtml = (root.data.childrenIds || [])
    .map((blockId) => renderBlock(document, blockId))
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${backdropColor}; font-family: ${fontFamily};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${backdropColor};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: ${canvasColor}; max-width: 100%; width: 600px;">
          <tr>
            <td style="padding: 0;">
              ${childrenHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function renderBlock(document: EmailDocument, blockId: string): string {
  const block = document[blockId] as EmailBlock;
  if (!block) return "";

  const style = buildInlineStyle(block.style, block);

  switch (block.type) {
    case "Container":
      return renderContainer(document, block as any, style);
    case "Text":
      return renderText(block as any, style);
    case "Heading":
      return renderHeading(block as any, style);
    case "Button":
      return renderButton(block as any, style);
    case "Image":
      return renderImage(block as any, style);
    case "Spacer":
      return renderSpacer(block as any, style);
    case "Divider":
      return renderDivider(block as any, style);
    case "Columns":
      return renderColumns(document, block as any, style);
    case "Html":
      return renderHtml(block as any, style);
    default:
      return "";
  }
}

function renderContainer(document: EmailDocument, block: any, style: string): string {
  const childrenIds = block.props?.childrenIds || [];
  const backgroundColor = block.props?.backgroundColor || "transparent";
  
  const childrenHtml = childrenIds
    .map((id: string) => renderBlock(document, id))
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style}; background-color: ${backgroundColor};">
    <tr>
      <td>
        ${childrenHtml}
      </td>
    </tr>
  </table>`;
}

function renderText(block: any, style: string): string {
  const text = block.props?.text || "";
  const link = block.props?.link;
  
  const content = link 
    ? `<a href="${escapeHtml(link)}" style="color: inherit; text-decoration: underline;">${escapeHtml(text)}</a>`
    : escapeHtml(text);

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style};">
        ${content.replace(/\n/g, "<br>")}
      </td>
    </tr>
  </table>`;
}

function renderHeading(block: any, style: string): string {
  const text = block.props?.text || "";
  const level = block.props?.level || 2;
  const tag = `h${level}`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style};">
        <${tag} style="margin: 0; ${style};">${escapeHtml(text)}</${tag}>
      </td>
    </tr>
  </table>`;
}

function renderButton(block: any, style: string): string {
  const text = block.props?.text || "Button";
  const link = block.props?.link || "#";
  const backgroundColor = block.props?.backgroundColor || "#007bff";
  const textColor = block.props?.textColor || "#ffffff";
  const align = block.props?.align || "center";

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background-color: ${backgroundColor};
    color: ${textColor};
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    text-align: center;
  `.trim().replace(/\s+/g, " ");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style}; text-align: ${align};">
        <a href="${escapeHtml(link)}" style="${buttonStyle}">${escapeHtml(text)}</a>
      </td>
    </tr>
  </table>`;
}

function renderImage(block: any, style: string): string {
  const src = block.props?.src || "";
  const alt = block.props?.alt || "";
  const link = block.props?.link;
  const width = block.props?.width;
  const align = block.props?.align || "center";

  const imgStyle = `display: block; max-width: 100%; height: auto; ${width ? `width: ${width}px;` : ""}`;
  const imgTag = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="${imgStyle}" />`;
  
  const content = link 
    ? `<a href="${escapeHtml(link)}">${imgTag}</a>`
    : imgTag;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style}; text-align: ${align};">
        ${content}
      </td>
    </tr>
  </table>`;
}

function renderSpacer(block: any, style: string): string {
  const height = block.props?.height || 20;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="height: ${height}px; line-height: ${height}px; font-size: 1px;">&nbsp;</td>
    </tr>
  </table>`;
}

function renderDivider(block: any, style: string): string {
  const color = block.props?.color || "#e0e0e0";
  const height = block.props?.height || 1;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style}; border-top: ${height}px solid ${color};">
        &nbsp;
      </td>
    </tr>
  </table>`;
}

function renderColumns(document: EmailDocument, block: any, style: string): string {
  const columns = block.props?.columns || 2;
  const childrenIds = block.props?.childrenIds || [];
  
  // Split children into columns
  const itemsPerColumn = Math.ceil(childrenIds.length / columns);
  const columnHtml = Array.from({ length: columns }, (_, colIndex) => {
    const startIndex = colIndex * itemsPerColumn;
    const columnChildren = childrenIds.slice(startIndex, startIndex + itemsPerColumn);
    const columnContent = columnChildren.map((id: string) => renderBlock(document, id)).join("");
    
    return `<td style="padding: 8px; vertical-align: top;" width="${100 / columns}%">
      ${columnContent}
    </td>`;
  }).join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      ${columnHtml}
    </tr>
  </table>`;
}

function renderHtml(block: any, style: string): string {
  const html = block.props?.html || "";

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="${style};">
    <tr>
      <td style="${style};">
        ${html}
      </td>
    </tr>
  </table>`;
}

function buildInlineStyle(blockStyle: any, block?: any): string {
  if (!blockStyle) return "";

  const styles: string[] = [];

  if (blockStyle.padding) {
    const p = blockStyle.padding;
    if (p.top !== undefined) styles.push(`padding-top: ${p.top}px;`);
    if (p.bottom !== undefined) styles.push(`padding-bottom: ${p.bottom}px;`);
    if (p.left !== undefined) styles.push(`padding-left: ${p.left}px;`);
    if (p.right !== undefined) styles.push(`padding-right: ${p.right}px;`);
  }

  if (blockStyle.margin) {
    const m = blockStyle.margin;
    if (m.top !== undefined) styles.push(`margin-top: ${m.top}px;`);
    if (m.bottom !== undefined) styles.push(`margin-bottom: ${m.bottom}px;`);
    if (m.left !== undefined) styles.push(`margin-left: ${m.left}px;`);
    if (m.right !== undefined) styles.push(`margin-right: ${m.right}px;`);
  }

  if (blockStyle.backgroundColor) {
    styles.push(`background-color: ${blockStyle.backgroundColor};`);
  }

  if (blockStyle.textColor || blockStyle.color) {
    styles.push(`color: ${blockStyle.textColor || blockStyle.color};`);
  }

  if (blockStyle.textAlign) {
    styles.push(`text-align: ${blockStyle.textAlign};`);
  }

  if (blockStyle.fontSize) {
    styles.push(`font-size: ${blockStyle.fontSize}px;`);
  }

  if (blockStyle.fontWeight) {
    styles.push(`font-weight: ${blockStyle.fontWeight};`);
  }

  if (blockStyle.fontFamily) {
    styles.push(`font-family: ${mapFontFamily(blockStyle.fontFamily)};`);
  }

  return styles.join(" ");
}

function mapFontFamily(fontFamily?: string): string {
  const fontMap: Record<string, string> = {
    MODERN_SANS: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    CLASSIC_SERIF: "Georgia, 'Times New Roman', Times, serif",
    BOOK_SERIF: "'Times New Roman', Times, serif",
  };

  return fontMap[fontFamily || "MODERN_SANS"] || "Arial, sans-serif";
}

function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Server-side fallback
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

