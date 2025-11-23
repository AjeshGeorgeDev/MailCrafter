/**
 * Password Reset Token Utilities
 * Functions for managing password reset tokens
 */

import { prisma } from "./prisma";
import { randomBytes } from "crypto";

const TOKEN_EXPIRY_HOURS = 24; // Tokens expire after 24 hours

/**
 * Generate a secure random token
 */
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Delete any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      used: false,
    },
  });

  // Generate token
  const token = generateResetToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_EXPIRY_HOURS);

  // Create token record
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expires,
    },
  });

  return token;
}

/**
 * Validate and get password reset token
 */
export async function getPasswordResetToken(
  token: string
): Promise<{ userId: string } | null> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return null;
  }

  // Check if token is expired
  if (resetToken.expires < new Date()) {
    // Delete expired token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });
    return null;
  }

  // Check if token is already used
  if (resetToken.used) {
    return null;
  }

  return {
    userId: resetToken.userId,
  };
}

/**
 * Mark password reset token as used
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  });
}

/**
 * Delete expired tokens (cleanup function)
 */
export async function deleteExpiredTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

