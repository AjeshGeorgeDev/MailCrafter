"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { testSMTPConnection, sendTestEmail } from "@/lib/email/smtp-tester";
import { smtpConfigSchema, type SMTPConfig } from "@/lib/validations/smtp";
import { revalidatePath } from "next/cache";

/**
 * Test SMTP Connection by Profile ID
 */
export async function testSMTPConnectionByProfile(profileId: string) {
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

    // Get profile
    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id: profileId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!profile) {
      return { error: "SMTP profile not found" };
    }

    // Decrypt password
    const decryptedPassword = decrypt(profile.password);

    // Build config
    const config: SMTPConfig = {
      host: profile.host,
      port: profile.port,
      username: profile.username,
      password: decryptedPassword,
      encryption: profile.encryption,
      fromEmail: profile.fromEmail,
    };

    // Test connection
    const result = await testSMTPConnection(config);

    // Update testedAt if successful
    if (result.success) {
      await prisma.smtpProfile.update({
        where: { id: profileId },
        data: { testedAt: new Date() },
      });
      revalidatePath("/settings/smtp");
    }

    return { success: true, result };
  } catch (error) {
    console.error("Test SMTP connection error:", error);
    return {
      error: "Failed to test SMTP connection",
      result: {
        success: false,
        connectionTime: 0,
        authentication: "not_tested" as const,
        ssl: { valid: false, issuer: null, expiresAt: null },
        error: error instanceof Error ? error.message : "Unknown error",
        details: "An unexpected error occurred while testing the connection.",
      },
    };
  }
}

/**
 * Test SMTP Configuration (before saving)
 */
export async function testSMTPConfig(config: SMTPConfig) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Validate config
    const validated = smtpConfigSchema.parse(config);

    // Test connection
    const result = await testSMTPConnection(validated);

    return { success: true, result };
  } catch (error) {
    console.error("Test SMTP config error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return { error: "Invalid SMTP configuration" };
    }
    return {
      error: "Failed to test SMTP configuration",
      result: {
        success: false,
        connectionTime: 0,
        authentication: "not_tested" as const,
        ssl: { valid: false, issuer: null, expiresAt: null },
        error: error instanceof Error ? error.message : "Unknown error",
        details: "An unexpected error occurred while testing the configuration.",
      },
    };
  }
}

/**
 * Send Test Email
 */
export async function sendSMTPTestEmail(profileId: string, testEmailAddress: string) {
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

    // Get profile
    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id: profileId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!profile) {
      return { error: "SMTP profile not found" };
    }

    // Decrypt password
    const decryptedPassword = decrypt(profile.password);

    // Build config
    const config: SMTPConfig = {
      host: profile.host,
      port: profile.port,
      username: profile.username,
      password: decryptedPassword,
      encryption: profile.encryption,
      fromEmail: profile.fromEmail,
    };

    // Send test email
    const result = await sendTestEmail(config, testEmailAddress);

    return { success: result.success, messageId: result.messageId, error: result.error };
  } catch (error) {
    console.error("Send test email error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to send test email",
    };
  }
}

