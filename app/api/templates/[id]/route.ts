/**
 * Get Template API Endpoint
 * GET /api/templates/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { getTemplateById } from "@/app/actions/templates";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getTemplateById(id);

    if (!result.success || result.error) {
      return NextResponse.json(
        { error: result.error || "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: result.template,
    });
  } catch (error) {
    console.error("Get template error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

