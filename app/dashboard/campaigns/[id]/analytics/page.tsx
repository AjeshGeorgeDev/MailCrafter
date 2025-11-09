/**
 * Campaign Analytics Page
 * Detailed analytics for a specific campaign
 */

import { getCampaignById } from "@/app/actions/campaigns";
import { getCampaignStatsAction, getEngagementTrendsAction } from "@/app/actions/analytics";
import { CampaignAnalyticsClient } from "./CampaignAnalyticsClient";
import { notFound } from "next/navigation";

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  const [campaignResult, statsResult, trendsResult] = await Promise.all([
    getCampaignById(params.id),
    getCampaignStatsAction(params.id),
    getEngagementTrendsAction(params.id, 30),
  ]);

  if (!campaignResult.success || !campaignResult.campaign) {
    notFound();
  }

  const stats = statsResult.success ? statsResult.stats : null;
  const trends = trendsResult.success ? trendsResult.trends : [];

  return (
    <CampaignAnalyticsClient
      campaign={campaignResult.campaign}
      stats={stats}
      trends={trends}
    />
  );
}

