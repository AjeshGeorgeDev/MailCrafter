/**
 * Analytics Service
 * Aggregates email statistics and metrics
 */

import { prisma } from "@/lib/db/prisma";

export interface CampaignStats {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalFailed: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  unsubscribeCount: number;
  unsubscribeRate: number;
}

export interface EngagementTrend {
  date: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
}

export interface OrganizationStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalSubscribers: number;
  activeCampaigns: number;
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  // Get all email logs for this campaign
  const emailLogs = await prisma.emailLog.findMany({
    where: { campaignId },
    include: {
      events: {
        select: {
          eventType: true,
          timestamp: true,
        },
      },
    },
  });

  const totalSent = emailLogs.length;
  const totalDelivered = emailLogs.filter((log) => log.status === "DELIVERED").length;
  const totalBounced = emailLogs.filter((log) => log.status === "BOUNCED").length;
  const totalFailed = emailLogs.filter((log) => log.status === "FAILED").length;

  // Get unique opens and clicks
  const openEvents = emailLogs
    .flatMap((log) => log.events.filter((e) => e.eventType === "OPENED"))
    .map((e) => e.timestamp);
  const uniqueOpens = new Set(openEvents.map((e) => e.toISOString().split("T")[0])).size;
  const totalOpens = openEvents.length;

  const clickEvents = emailLogs
    .flatMap((log) => log.events.filter((e) => e.eventType === "CLICKED"))
    .map((e) => e.timestamp);
  const uniqueClicks = new Set(clickEvents.map((e) => e.toISOString().split("T")[0])).size;
  const totalClicks = clickEvents.length;

  // Calculate rates
  const openRate = totalDelivered > 0 ? (uniqueOpens / totalDelivered) * 100 : 0;
  const clickRate = totalDelivered > 0 ? (uniqueClicks / totalDelivered) * 100 : 0;
  const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;

  // Get unsubscribe count
  const unsubscribeCount = await prisma.unsubscribeRecord.count({
    where: { campaignId },
  });
  const unsubscribeRate = totalDelivered > 0 ? (unsubscribeCount / totalDelivered) * 100 : 0;

  return {
    totalSent,
    totalDelivered,
    totalBounced,
    totalFailed,
    uniqueOpens,
    uniqueClicks,
    totalOpens,
    totalClicks,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
    clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    unsubscribeCount,
    unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
  };
}

/**
 * Get engagement trends over time
 */
export async function getEngagementTrends(
  campaignId: string,
  days: number = 30
): Promise<EngagementTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const emailLogs = await prisma.emailLog.findMany({
    where: {
      campaignId,
      createdAt: { gte: startDate },
    },
    include: {
      events: {
        select: {
          eventType: true,
          timestamp: true,
        },
      },
    },
  });

  // Group by date
  const trendsMap = new Map<string, EngagementTrend>();

  emailLogs.forEach((log) => {
    const date = log.createdAt.toISOString().split("T")[0];
    if (!trendsMap.has(date)) {
      trendsMap.set(date, {
        date,
        sent: 0,
        delivered: 0,
        opens: 0,
        clicks: 0,
        bounces: 0,
      });
    }

    const trend = trendsMap.get(date)!;
    trend.sent++;

    if (log.status === "DELIVERED") {
      trend.delivered++;
    }
    if (log.status === "BOUNCED") {
      trend.bounces++;
    }

    log.events.forEach((event) => {
      if (event.eventType === "OPENED") {
        trend.opens++;
      }
      if (event.eventType === "CLICKED") {
        trend.clicks++;
      }
    });
  });

  // Convert to array and sort by date
  return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get organization-wide statistics
 */
export async function getOrganizationStats(
  organizationId: string,
  dateRange?: { startDate: Date; endDate: Date }
): Promise<OrganizationStats> {
  const where: any = {
    organization: {
      campaigns: {
        some: {
          organizationId,
        },
      },
    },
  };

  if (dateRange) {
    where.createdAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
  }

  // Get all email logs for organization
  const emailLogs = await prisma.emailLog.findMany({
    where: {
      campaign: {
        organizationId,
      },
      ...(dateRange && {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      }),
    },
    include: {
      events: {
        select: {
          eventType: true,
          timestamp: true,
        },
      },
    },
  });

  const totalSent = emailLogs.length;
  const totalDelivered = emailLogs.filter((log) => log.status === "DELIVERED").length;

  // Calculate unique opens and clicks
  const uniqueOpens = new Set(
    emailLogs
      .flatMap((log) => log.events.filter((e) => e.eventType === "OPENED"))
      .map((e) => e.timestamp.toISOString().split("T")[0])
  ).size;

  const uniqueClicks = new Set(
    emailLogs
      .flatMap((log) => log.events.filter((e) => e.eventType === "CLICKED"))
      .map((e) => e.timestamp.toISOString().split("T")[0])
  ).size;

  const averageOpenRate = totalDelivered > 0 ? (uniqueOpens / totalDelivered) * 100 : 0;
  const averageClickRate = totalDelivered > 0 ? (uniqueClicks / totalDelivered) * 100 : 0;

  // Get campaign counts
  const totalCampaigns = await prisma.campaign.count({
    where: {
      organizationId,
      ...(dateRange && {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      }),
    },
  });

  const activeCampaigns = await prisma.campaign.count({
    where: {
      organizationId,
      status: { in: ["SENDING", "SCHEDULED"] },
    },
  });

  // Get total subscribers (from contact lists)
  const totalSubscribers = await prisma.contact.count({
    where: {
      list: {
        organizationId,
      },
      status: "SUBSCRIBED",
    },
  });

  return {
    totalCampaigns,
    totalSent,
    totalDelivered,
    averageOpenRate: Math.round(averageOpenRate * 100) / 100,
    averageClickRate: Math.round(averageClickRate * 100) / 100,
    totalSubscribers,
    activeCampaigns,
  };
}

/**
 * Get top performing campaigns
 */
export async function getTopCampaigns(
  organizationId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
}>> {
  const campaigns = await prisma.campaign.findMany({
    where: { organizationId },
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      emailLogs: {
        include: {
      events: {
        select: {
          eventType: true,
          timestamp: true,
        },
      },
        },
      },
    },
  });

  return campaigns.map((campaign) => {
    const logs = campaign.emailLogs;
    const delivered = logs.filter((log) => log.status === "DELIVERED").length;
    const uniqueOpens = new Set(
      logs
        .flatMap((log) => log.events.filter((e) => e.eventType === "OPENED"))
        .map((e) => e.timestamp.toISOString().split("T")[0])
    ).size;
    const uniqueClicks = new Set(
      logs
        .flatMap((log) => log.events.filter((e) => e.eventType === "CLICKED"))
        .map((e) => e.timestamp.toISOString().split("T")[0])
    ).size;

    return {
      id: campaign.id,
      name: campaign.name,
      sent: logs.length,
      openRate: delivered > 0 ? Math.round((uniqueOpens / delivered) * 100 * 100) / 100 : 0,
      clickRate: delivered > 0 ? Math.round((uniqueClicks / delivered) * 100 * 100) / 100 : 0,
    };
  });
}

