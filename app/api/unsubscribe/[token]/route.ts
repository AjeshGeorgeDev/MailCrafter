/**
 * One-Click Unsubscribe API Route
 * Handles List-Unsubscribe-Post requests
 */

import { NextRequest, NextResponse } from "next/server";
import { decryptUnsubscribeToken } from "@/lib/email/unsubscribe";
import { unsubscribeAction } from "@/app/actions/unsubscribe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const tokenData = decryptUnsubscribeToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe token" },
        { status: 400 }
      );
    }

    // Process unsubscribe
    const result = await unsubscribeAction({
      email: tokenData.email,
      campaignId: tokenData.campaignId,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("One-click unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe" },
      { status: 500 }
    );
  }
}

