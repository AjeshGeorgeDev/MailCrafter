"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  getEmailLogs,
  getEmailLogDetails,
  getEmailStatistics,
} from "@/lib/email/email-logger";
import { revalidatePath } from "next/cache";

/**
 * Get email logs with filters and pagination
 */
export async function getEmailLogsAction(filters: {
  campaignId?: string;
  templateId?: string;
  recipientEmail?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
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
      return { logs: [], total: 0, limit: 50, offset: 0 };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    const result = await getEmailLogs({
      organizationId: orgMember.organization.id,
      campaignId: filters.campaignId,
      templateId: filters.templateId,
      recipientEmail: filters.recipientEmail,
      status: filters.status as any,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit,
      offset,
    });

    return { success: true, ...result };
  } catch (error) {
    console.error("Get email logs error:", error);
    return { error: "Failed to get email logs" };
  }
}

/**
 * Get email log details
 */
export async function getEmailLogDetailsAction(id: string) {
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

    const emailLog = await getEmailLogDetails(id);

    if (!emailLog) {
      return { error: "Email log not found" };
    }

    // Verify the email log belongs to the user's organization
    const template = await prisma.template.findFirst({
      where: {
        id: emailLog.templateId,
        organizationId: orgMember.organization.id,
      },
      select: { id: true },
    });

    if (!template) {
      return { error: "Email log not found" };
    }

    return { success: true, emailLog };
  } catch (error) {
    console.error("Get email log details error:", error);
    return { error: "Failed to get email log details" };
  }
}

/**
 * Get email statistics
 */
export async function getEmailStatisticsAction(filters: {
  campaignId?: string;
  templateId?: string;
  startDate?: string;
  endDate?: string;
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

    const stats = await getEmailStatistics({
      organizationId: orgMember.organization.id,
      campaignId: filters.campaignId,
      templateId: filters.templateId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });

    return { success: true, statistics: stats };
  } catch (error) {
    console.error("Get email statistics error:", error);
    return { error: "Failed to get email statistics" };
  }
}

/**
 * Export email logs to CSV
 */
export async function exportEmailLogs(filters: {
  campaignId?: string;
  templateId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
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

    const result = await getEmailLogs({
      organizationId: orgMember.organization.id,
      campaignId: filters.campaignId,
      templateId: filters.templateId,
      status: filters.status as any,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: 10000, // Large limit for export
      offset: 0,
    });

    // Convert to CSV
    const headers = [
      "ID",
      "Recipient Email",
      "Template ID",
      "Campaign ID",
      "Status",
      "Language",
      "Sent At",
      "Delivered At",
      "Created At",
      "Error Message",
    ];

    const rows = result.logs.map((log) => [
      log.id,
      log.recipientEmail,
      log.templateId,
      log.campaignId || "",
      log.status,
      log.languageCode,
      log.sentAt?.toISOString() || "",
      log.deliveredAt?.toISOString() || "",
      log.createdAt.toISOString(),
      log.errorMessage || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return { success: true, csv };
  } catch (error) {
    console.error("Export email logs error:", error);
    return { error: "Failed to export email logs" };
  }
}

