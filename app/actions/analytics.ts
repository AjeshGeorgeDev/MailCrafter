"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  getCampaignStats,
  getEngagementTrends,
  getOrganizationStats,
  getTopCampaigns,
} from "@/lib/analytics/analytics-service";

/**
 * Get campaign statistics
 */
export async function getCampaignStatsAction(campaignId: string) {
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

    const stats = await getCampaignStats(campaignId);
    return { success: true, stats };
  } catch (error) {
    console.error("Get campaign stats error:", error);
    return { error: "Failed to get campaign statistics" };
  }
}

/**
 * Get engagement trends
 */
export async function getEngagementTrendsAction(
  campaignId: string,
  days: number = 30
) {
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

    const trends = await getEngagementTrends(campaignId, days);
    return { success: true, trends };
  } catch (error) {
    console.error("Get engagement trends error:", error);
    return { error: "Failed to get engagement trends" };
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStatsAction(dateRange?: {
  startDate: string;
  endDate: string;
}) {
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

    const range = dateRange
      ? {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate),
        }
      : undefined;

    const stats = await getOrganizationStats(orgMember.organization.id, range);
    return { success: true, stats };
  } catch (error) {
    console.error("Get organization stats error:", error);
    return { error: "Failed to get organization statistics" };
  }
}

/**
 * Get top performing campaigns
 */
export async function getTopCampaignsAction(limit: number = 10) {
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

    const campaigns = await getTopCampaigns(orgMember.organization.id, limit);
    return { success: true, campaigns };
  } catch (error) {
    console.error("Get top campaigns error:", error);
    return { error: "Failed to get top campaigns" };
  }
}

