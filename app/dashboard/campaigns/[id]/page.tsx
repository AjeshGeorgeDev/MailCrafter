/**
 * Campaign Detail/Monitor Page
 * View campaign details, progress, and manage sending
 */

import { getCampaignById } from "@/app/actions/campaigns";
import { getCampaignStatsAction } from "@/app/actions/analytics";
import { CampaignMonitorClient } from "./CampaignMonitorClient";
import { notFound } from "next/navigation";

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  
  const [campaignResult, statsResult] = await Promise.all([
    getCampaignById(id),
    getCampaignStatsAction(id),
  ]);

  if (!campaignResult.success || !campaignResult.campaign) {
    notFound();
  }

  const stats = statsResult.success ? statsResult.stats : null;

  return (
    <CampaignMonitorClient
      campaign={campaignResult.campaign}
      stats={stats}
    />
  );
}

