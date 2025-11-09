"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  removeFromSuppression,
  getSuppressedEmails,
} from "@/lib/email/bounce-handler";
import { revalidatePath } from "next/cache";

/**
 * Get bounce records
 */
export async function getBounceRecords(filters: {
  bounceType?: "HARD" | "SOFT";
  isSuppressed?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const where: any = {};

    if (filters.bounceType) {
      where.bounceType = filters.bounceType;
    }

    if (filters.isSuppressed !== undefined) {
      where.isSuppressed = filters.isSuppressed;
    }

    const [bounces, total] = await Promise.all([
      prisma.bounceRecord.findMany({
        where,
        orderBy: { lastBouncedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.bounceRecord.count({ where }),
    ]);

    return { success: true, bounces, total, page, limit };
  } catch (error) {
    console.error("Get bounce records error:", error);
    return { error: "Failed to get bounce records" };
  }
}

/**
 * Remove email from suppression
 */
export async function removeEmailFromSuppression(email: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (OWNER, ADMIN only)
    if (!["OWNER", "ADMIN"].includes(orgMember.role)) {
      return { error: "Insufficient permissions. Admin access required." };
    }

    const success = await removeFromSuppression(email);

    if (success) {
      revalidatePath("/dashboard/bounces");
      return { success: true };
    } else {
      return { error: "Failed to remove from suppression" };
    }
  } catch (error) {
    console.error("Remove from suppression error:", error);
    return { error: "Failed to remove from suppression" };
  }
}

/**
 * Get suppressed emails count
 */
export async function getSuppressedCount() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const count = await prisma.bounceRecord.count({
      where: { isSuppressed: true },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Get suppressed count error:", error);
    return { error: "Failed to get suppressed count" };
  }
}

