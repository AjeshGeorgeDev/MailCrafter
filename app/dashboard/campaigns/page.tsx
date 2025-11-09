/**
 * Campaigns Page
 * List all campaigns with filters and search
 */

export const dynamic = 'force-dynamic';

import { getCampaigns } from "@/app/actions/campaigns";
import { CampaignsClient } from "./CampaignsClient";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(searchParams.page as string) || 1;
  const status = searchParams.status as string;
  const search = searchParams.search as string;

  const result = await getCampaigns({
    status: status as any,
    search,
    page,
    limit: 20,
  });

  const campaigns = result.campaigns || [];
  const total = result.total || 0;

  return (
    <CampaignsClient
      initialCampaigns={campaigns}
      total={total}
      currentPage={page}
    />
  );
}
