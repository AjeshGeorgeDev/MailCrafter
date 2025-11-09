/**
 * Email Tracking Utilities
 * Generate tracking pixels and wrap links for open/click tracking
 */

import { encrypt, decrypt } from "@/lib/security/encryption";

/**
 * Generate tracking pixel URL for open tracking
 */
export function generateTrackingPixel(emailLogId: string): string {
  // Encrypt the email log ID for privacy
  const encryptedId = encrypt(emailLogId);
  
  // Encode for URL
  const encodedId = encodeURIComponent(encryptedId);
  
  // Return tracking URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/track/open/${encodedId}`;
}

/**
 * Decrypt tracking pixel ID
 */
export function decryptTrackingId(encryptedId: string): string {
  try {
    const decodedId = decodeURIComponent(encryptedId);
    return decrypt(decodedId);
  } catch (error) {
    throw new Error("Invalid tracking ID");
  }
}

/**
 * Inject tracking pixel into HTML
 */
export function injectTrackingPixel(html: string, pixelUrl: string): string {
  // Check if HTML already has a tracking pixel
  if (html.includes('track/open/')) {
    return html; // Already has tracking
  }

  // Find the closing </body> tag or end of HTML
  const bodyEndIndex = html.lastIndexOf("</body>");
  
  if (bodyEndIndex !== -1) {
    // Insert before </body>
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    return (
      html.slice(0, bodyEndIndex) +
      pixel +
      html.slice(bodyEndIndex)
    );
  } else {
    // No </body> tag, append at the end
    const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    return html + pixel;
  }
}

/**
 * Generate click tracking URL
 */
export function generateClickTrackingUrl(
  emailLogId: string,
  originalUrl: string
): string {
  // Create tracking data
  const trackingData = {
    logId: emailLogId,
    url: originalUrl,
  };

  // Encrypt the data
  const encryptedData = encrypt(JSON.stringify(trackingData));
  
  // Encode for URL
  const encodedData = encodeURIComponent(encryptedData);
  
  // Return tracking URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/track/click/${encodedData}`;
}

/**
 * Decrypt click tracking data
 */
export function decryptClickTrackingData(encryptedData: string): {
  logId: string;
  url: string;
} {
  try {
    const decodedData = decodeURIComponent(encryptedData);
    const decryptedData = decrypt(decodedData);
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error("Invalid click tracking data");
  }
}

/**
 * Wrap all links in HTML with tracking URLs
 */
export function wrapLinks(html: string, emailLogId: string): string {
  // Regular expression to find all <a> tags with href attributes
  const linkRegex = /<a\s+([^>]*\s+)?href=["']([^"']+)["']([^>]*)>/gi;

  return html.replace(linkRegex, (match, before, url, after) => {
    // Skip if already a tracking link
    if (url.includes("/api/track/click/")) {
      return match;
    }

    // Skip mailto:, tel:, javascript:, and anchor links
    if (
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("javascript:") ||
      url.startsWith("#")
    ) {
      return match;
    }

    // Generate tracking URL
    const trackingUrl = generateClickTrackingUrl(emailLogId, url);

    // Replace the href with tracking URL
    return `<a ${before || ""}href="${trackingUrl}"${after}>`;
  });
}

/**
 * Inject tracking into email HTML
 * Combines pixel injection and link wrapping
 */
export function injectTracking(
  html: string,
  emailLogId: string,
  options: {
    trackOpens?: boolean;
    trackClicks?: boolean;
  } = {}
): string {
  const { trackOpens = true, trackClicks = true } = options;

  let trackedHtml = html;

  // Inject tracking pixel
  if (trackOpens) {
    const pixelUrl = generateTrackingPixel(emailLogId);
    trackedHtml = injectTrackingPixel(trackedHtml, pixelUrl);
  }

  // Wrap links
  if (trackClicks) {
    trackedHtml = wrapLinks(trackedHtml, emailLogId);
  }

  return trackedHtml;
}

