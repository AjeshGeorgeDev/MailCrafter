/**
 * Analytics Dashboard Page
 * Organization-wide analytics and insights
 */

export const dynamic = 'force-dynamic';

import { getOrganizationStatsAction, getTopCampaignsAction } from "@/app/actions/analytics";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const [orgStatsResult, topCampaignsResult] = await Promise.all([
    getOrganizationStatsAction(),
    getTopCampaignsAction(10),
  ]);

  const orgStats = orgStatsResult.success ? orgStatsResult.stats : null;
  const topCampaigns = topCampaignsResult.success ? topCampaignsResult.campaigns : [];

  return (
    <AnalyticsClient
      initialStats={orgStats}
      initialTopCampaigns={topCampaigns}
    />
  );
}
