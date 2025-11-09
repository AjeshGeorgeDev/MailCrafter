/**
 * Open Tracking API
 * Tracks email opens via 1x1 transparent pixel
 * GET /api/track/open/[encryptedId]
 */

import { NextRequest, NextResponse } from "next/server";
import { decryptTrackingId } from "@/lib/email/tracking";
import { logEmailEvent } from "@/lib/email/email-logger";

export const dynamic = "force-dynamic";

/**
 * Generate 1x1 transparent PNG
 */
function generateTransparentPixel(): ArrayBuffer {
  // 1x1 transparent PNG in base64
  const base64PNG =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  return Buffer.from(base64PNG, "base64").buffer;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ encryptedId: string }> }
) {
  try {
    const { encryptedId } = await params;

    if (!encryptedId) {
      return new NextResponse(generateTransparentPixel(), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }

    // Check Do Not Track header (privacy)
    const dnt = request.headers.get("dnt");
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "Unknown";

    // Decrypt email log ID
    let emailLogId: string;
    try {
      emailLogId = decryptTrackingId(encryptedId);
    } catch (error) {
      // Invalid tracking ID, still return pixel but don't log
      return new NextResponse(generateTransparentPixel(), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Log open event (respect DNT header)
    if (dnt !== "1") {
      try {
        await logEmailEvent(emailLogId, {
          eventType: "OPENED",
          metadata: {
            userAgent,
            ipAddress: ipAddress !== "Unknown" ? ipAddress : null, // Anonymize if needed
            timestamp: new Date().toISOString(),
            dnt: dnt === "1",
          },
        });
      } catch (error) {
        // Log error but don't fail the request
        console.error("Failed to log open event:", error);
      }
    }

    // Return 1x1 transparent PNG
    return new NextResponse(generateTransparentPixel(), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Open tracking error:", error);
    // Always return pixel, even on error
    return new NextResponse(generateTransparentPixel(), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
}

