/**
 * Export Service
 * Export analytics data to various formats
 */

import * as XLSX from "xlsx";
import type { CampaignStats, EngagementTrend } from "./analytics-service";

/**
 * Export campaign statistics to CSV
 */
export function exportCampaignStatsToCSV(
  campaignName: string,
  stats: CampaignStats
): string {
  const rows = [
    ["Campaign Statistics", campaignName],
    [],
    ["Metric", "Value"],
    ["Total Sent", stats.totalSent],
    ["Total Delivered", stats.totalDelivered],
    ["Total Bounced", stats.totalBounced],
    ["Total Failed", stats.totalFailed],
    ["Unique Opens", stats.uniqueOpens],
    ["Total Opens", stats.totalOpens],
    ["Unique Clicks", stats.uniqueClicks],
    ["Total Clicks", stats.totalClicks],
    ["Open Rate (%)", stats.openRate.toFixed(2)],
    ["Click Rate (%)", stats.clickRate.toFixed(2)],
    ["Click-to-Open Rate (%)", stats.clickToOpenRate.toFixed(2)],
    ["Bounce Rate (%)", stats.bounceRate.toFixed(2)],
    ["Unsubscribe Count", stats.unsubscribeCount],
    ["Unsubscribe Rate (%)", stats.unsubscribeRate.toFixed(2)],
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Export engagement trends to CSV
 */
export function exportTrendsToCSV(trends: EngagementTrend[]): string {
  const rows = [
    ["Date", "Sent", "Delivered", "Opens", "Clicks", "Bounces"],
    ...trends.map((trend) => [
      trend.date,
      trend.sent,
      trend.delivered,
      trend.opens,
      trend.clicks,
      trend.bounces,
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Export campaign statistics to Excel
 */
export function exportCampaignStatsToExcel(
  campaignName: string,
  stats: CampaignStats,
  trends: EngagementTrend[]
): Buffer {
  const workbook = XLSX.utils.book_new();

  // Stats sheet
  const statsData = [
    ["Campaign Statistics", campaignName],
    [],
    ["Metric", "Value"],
    ["Total Sent", stats.totalSent],
    ["Total Delivered", stats.totalDelivered],
    ["Total Bounced", stats.totalBounced],
    ["Total Failed", stats.totalFailed],
    ["Unique Opens", stats.uniqueOpens],
    ["Total Opens", stats.totalOpens],
    ["Unique Clicks", stats.uniqueClicks],
    ["Total Clicks", stats.totalClicks],
    ["Open Rate (%)", stats.openRate],
    ["Click Rate (%)", stats.clickRate],
    ["Click-to-Open Rate (%)", stats.clickToOpenRate],
    ["Bounce Rate (%)", stats.bounceRate],
    ["Unsubscribe Count", stats.unsubscribeCount],
    ["Unsubscribe Rate (%)", stats.unsubscribeRate],
  ];
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Statistics");

  // Trends sheet
  const trendsData = [
    ["Date", "Sent", "Delivered", "Opens", "Clicks", "Bounces"],
    ...trends.map((trend) => [
      trend.date,
      trend.sent,
      trend.delivered,
      trend.opens,
      trend.clicks,
      trend.bounces,
    ]),
  ];
  const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
  XLSX.utils.book_append_sheet(workbook, trendsSheet, "Trends");

  return Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
}

/**
 * Export organization stats to CSV
 */
export function exportOrganizationStatsToCSV(data: {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalSubscribers: number;
  activeCampaigns: number;
}): string {
  const rows = [
    ["Organization Statistics"],
    [],
    ["Metric", "Value"],
    ["Total Campaigns", data.totalCampaigns],
    ["Total Sent", data.totalSent],
    ["Total Delivered", data.totalDelivered],
    ["Average Open Rate (%)", data.averageOpenRate.toFixed(2)],
    ["Average Click Rate (%)", data.averageClickRate.toFixed(2)],
    ["Total Subscribers", data.totalSubscribers],
    ["Active Campaigns", data.activeCampaigns],
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

