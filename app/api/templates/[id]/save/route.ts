/**
 * Save Template API Endpoint
 * POST /api/templates/[id]/save
 */

import { NextRequest, NextResponse } from "next/server";
import { saveTemplate } from "@/app/actions/templates";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { structure } = body;

    if (!structure) {
      return NextResponse.json(
        { error: "Structure is required" },
        { status: 400 }
      );
    }

    const result = await saveTemplate(id, structure);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      template: result.template,
    });
  } catch (error) {
    console.error("Save template error:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}

