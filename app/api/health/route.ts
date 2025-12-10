/**
 * Health Check Endpoint
 * Used by Docker health checks and deployment platforms like Coolify
 * 
 * Returns 200 if the application and database are healthy
 * Returns 503 if there are any issues
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const checks: Record<string, boolean> = {};
  let isHealthy = true;

  try {
    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (dbError) {
      checks.database = false;
      isHealthy = false;
    }

    // Return health status
    if (isHealthy) {
      return NextResponse.json(
        {
          status: "healthy",
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          checks,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks,
      },
      { status: 503 }
    );
  }
}

