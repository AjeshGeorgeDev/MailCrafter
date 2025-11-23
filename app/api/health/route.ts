/**
 * Health Check Endpoint
 * Used by Docker health checks
 */

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check - can be extended to check database, redis, etc.
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

