/**
 * Click Tracking API
 * Tracks email link clicks and redirects to original URL
 * GET /api/track/click/[encryptedData]
 */

import { NextRequest, NextResponse } from "next/server";
import { decryptClickTrackingData } from "@/lib/email/tracking";
import { logEmailEvent } from "@/lib/email/email-logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ encryptedData: string }> }
) {
  try {
    const { encryptedData } = await params;

    if (!encryptedData) {
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    // Get metadata
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "Unknown";
    const referer = request.headers.get("referer") || null;

    // Decrypt tracking data
    let trackingData: { logId: string; url: string };
    try {
      trackingData = decryptClickTrackingData(encryptedData);
    } catch (error) {
      console.error("Failed to decrypt click tracking data:", error);
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    const { logId: emailLogId, url: originalUrl } = trackingData;

    // Validate URL
    let redirectUrl: URL;
    try {
      // If URL is relative, make it absolute
      if (originalUrl.startsWith("/") || originalUrl.startsWith("#")) {
        redirectUrl = new URL(originalUrl, request.url);
      } else {
        redirectUrl = new URL(originalUrl);
      }
    } catch (error) {
      console.error("Invalid redirect URL:", originalUrl);
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    // Log click event
    try {
      await logEmailEvent(emailLogId, {
        eventType: "CLICKED",
        metadata: {
          url: originalUrl,
          userAgent,
          ipAddress: ipAddress !== "Unknown" ? ipAddress : null,
          referer,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Log error but don't fail the redirect
      console.error("Failed to log click event:", error);
    }

    // Redirect to original URL (302 temporary redirect)
    return NextResponse.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error("Click tracking error:", error);
    // On error, redirect to home
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
}

