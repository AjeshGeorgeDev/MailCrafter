"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getCampaignStats, getEngagementTrends } from "@/lib/analytics/analytics-service";
import {
  exportCampaignStatsToCSV,
  exportCampaignStatsToExcel,
  exportTrendsToCSV,
  exportOrganizationStatsToCSV,
} from "@/lib/analytics/export-service";

/**
 * Export campaign analytics to CSV
 */
export async function exportCampaignAnalyticsCSV(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify campaign belongs to user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    const [stats, trends] = await Promise.all([
      getCampaignStats(campaignId),
      getEngagementTrends(campaignId, 30),
    ]);

    const csv = exportCampaignStatsToCSV(campaign.name, stats);
    const trendsCSV = exportTrendsToCSV(trends);

    return {
      success: true,
      csv: `${csv}\n\nEngagement Trends\n${trendsCSV}`,
      filename: `campaign-${campaign.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`,
    };
  } catch (error) {
    console.error("Export campaign analytics error:", error);
    return { error: "Failed to export campaign analytics" };
  }
}

/**
 * Export campaign analytics to Excel
 */
export async function exportCampaignAnalyticsExcel(campaignId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify campaign belongs to user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    const [stats, trends] = await Promise.all([
      getCampaignStats(campaignId),
      getEngagementTrends(campaignId, 30),
    ]);

    const buffer = exportCampaignStatsToExcel(campaign.name, stats, trends);

    return {
      success: true,
      buffer: buffer.toString("base64"),
      filename: `campaign-${campaign.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`,
    };
  } catch (error) {
    console.error("Export campaign analytics error:", error);
    return { error: "Failed to export campaign analytics" };
  }
}

/**
 * Export organization analytics to CSV
 */
export async function exportOrganizationAnalyticsCSV() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const { getOrganizationStats } = await import("@/lib/analytics/analytics-service");
    const stats = await getOrganizationStats(orgMember.organization.id);

    const csv = exportOrganizationStatsToCSV(stats);

    return {
      success: true,
      csv,
      filename: `organization-analytics-${new Date().toISOString().split("T")[0]}.csv`,
    };
  } catch (error) {
    console.error("Export organization analytics error:", error);
    return { error: "Failed to export organization analytics" };
  }
}

