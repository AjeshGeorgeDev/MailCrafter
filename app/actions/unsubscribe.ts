"use server";

import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Unsubscribe email address
 */
export async function unsubscribeAction(data: {
  email: string;
  campaignId?: string;
  reason?: string;
}) {
  try {
    // Get IP address from headers
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Check if already unsubscribed
    const existing = await prisma.unsubscribeRecord.findFirst({
      where: {
        email: data.email,
        campaignId: data.campaignId || null,
      },
    });

    if (existing) {
      return { success: true, message: "Already unsubscribed" };
    }

    // Create unsubscribe record
    await prisma.unsubscribeRecord.create({
      data: {
        email: data.email,
        campaignId: data.campaignId || null,
        reason: data.reason || null,
        ipAddress,
      },
    });

    // Log unsubscribe event for all email logs from this email
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        recipientEmail: data.email,
        ...(data.campaignId && { campaignId: data.campaignId }),
      },
    });

    for (const log of emailLogs) {
      await prisma.emailEvent.create({
        data: {
          emailLogId: log.id,
          eventType: "UNSUBSCRIBED",
          metadata: {
            reason: data.reason,
            ipAddress,
          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, message: "Successfully unsubscribed" };
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return { error: "Failed to unsubscribe" };
  }
}

/**
 * Check if email is unsubscribed
 */
export async function isUnsubscribed(
  email: string,
  campaignId?: string
): Promise<boolean> {
  try {
    const record = await prisma.unsubscribeRecord.findFirst({
      where: {
        email,
        ...(campaignId ? { campaignId } : { campaignId: null }),
      },
    });

    return !!record;
  } catch (error) {
    console.error("Check unsubscribe error:", error);
    return false;
  }
}

