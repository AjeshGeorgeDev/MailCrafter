/**
 * Bounce Handler
 * Processes email bounces and updates bounce records
 */

import { prisma } from "@/lib/db/prisma";
import type { BounceType } from "@prisma/client";

/**
 * Hard bounce error patterns
 */
const HARD_BOUNCE_PATTERNS = [
  /550/i, // Mailbox unavailable
  /551/i, // User not local
  /552/i, // Mailbox full (sometimes hard)
  /553/i, // Mailbox name not allowed
  /554/i, // Transaction failed
  /permanent failure/i,
  /mailbox does not exist/i,
  /user unknown/i,
  /address rejected/i,
  /invalid recipient/i,
  /no such user/i,
  /recipient address rejected/i,
  /user not found/i,
  /550.*mailbox.*not found/i,
  /550.*user.*unknown/i,
];

/**
 * Soft bounce error patterns
 */
const SOFT_BOUNCE_PATTERNS = [
  /421/i, // Service not available
  /450/i, // Mailbox unavailable (temporary)
  /451/i, // Error in processing
  /452/i, // Insufficient system storage
  /temporary failure/i,
  /mailbox full/i,
  /quota exceeded/i,
  /message too large/i,
  /timeout/i,
  /connection.*refused/i,
  /temporarily unavailable/i,
];

/**
 * Classify bounce type based on error message
 */
export function classifyBounceType(errorMessage: string): BounceType {
  const error = errorMessage.toLowerCase();

  // Check for hard bounce patterns
  for (const pattern of HARD_BOUNCE_PATTERNS) {
    if (pattern.test(error)) {
      return "HARD";
    }
  }

  // Check for soft bounce patterns
  for (const pattern of SOFT_BOUNCE_PATTERNS) {
    if (pattern.test(error)) {
      return "SOFT";
    }
  }

  // Default to soft bounce if unclear
  return "SOFT";
}

/**
 * Process a bounce for an email
 */
export async function processBounce(
  email: string,
  errorMessage: string,
  smtpResponse?: string
): Promise<{ success: boolean; bounceType: BounceType; isSuppressed: boolean }> {
  try {
    const bounceType = classifyBounceType(errorMessage);
    const bounceReason = errorMessage.substring(0, 1000); // Limit length

    // Check if bounce record exists
    const existingRecord = await prisma.bounceRecord.findUnique({
      where: { email },
    });

    if (existingRecord) {
      // Update existing record
      const newBounceCount = existingRecord.bounceCount + 1;
      const shouldSuppress =
        bounceType === "HARD" || newBounceCount >= 3; // Suppress after 3 soft bounces

      await prisma.bounceRecord.update({
        where: { email },
        data: {
          bounceType: bounceType === "HARD" ? "HARD" : existingRecord.bounceType, // Keep HARD if already set
          bounceReason,
          bounceCount: newBounceCount,
          lastBouncedAt: new Date(),
          isSuppressed: shouldSuppress || existingRecord.isSuppressed,
        },
      });

      return {
        success: true,
        bounceType,
        isSuppressed: shouldSuppress || existingRecord.isSuppressed,
      };
    } else {
      // Create new bounce record
      const isSuppressed = bounceType === "HARD"; // Suppress hard bounces immediately

      await prisma.bounceRecord.create({
        data: {
          email,
          bounceType,
          bounceReason,
          bounceCount: 1,
          isSuppressed,
        },
      });

      return {
        success: true,
        bounceType,
        isSuppressed,
      };
    }
  } catch (error) {
    console.error("Process bounce error:", error);
    return {
      success: false,
      bounceType: "SOFT",
      isSuppressed: false,
    };
  }
}

/**
 * Check if email is suppressed (should not send)
 */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const record = await prisma.bounceRecord.findUnique({
      where: { email },
      select: { isSuppressed: true },
    });

    return record?.isSuppressed || false;
  } catch (error) {
    console.error("Check suppressed email error:", error);
    return false;
  }
}

/**
 * Remove email from suppression list
 */
export async function removeFromSuppression(email: string): Promise<boolean> {
  try {
    await prisma.bounceRecord.update({
      where: { email },
      data: {
        isSuppressed: false,
      },
    });

    return true;
  } catch (error) {
    console.error("Remove from suppression error:", error);
    return false;
  }
}

/**
 * Get all suppressed emails
 */
export async function getSuppressedEmails(limit: number = 100) {
  try {
    return await prisma.bounceRecord.findMany({
      where: { isSuppressed: true },
      orderBy: { lastBouncedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    console.error("Get suppressed emails error:", error);
    return [];
  }
}

