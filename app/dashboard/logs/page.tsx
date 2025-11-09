/**
 * Email Logs Page
 * View email delivery logs and tracking data
 */

export const dynamic = 'force-dynamic';

import { getEmailLogsAction } from "@/app/actions/email-logs";
import { EmailLogsClient } from "./EmailLogsClient";

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(searchParams.page as string) || 1;
  const limit = parseInt(searchParams.limit as string) || 50;

  const result = await getEmailLogsAction({
    campaignId: searchParams.campaignId as string,
    templateId: searchParams.templateId as string,
    recipientEmail: searchParams.search as string,
    status: searchParams.status as string,
    startDate: searchParams.startDate as string,
    endDate: searchParams.endDate as string,
    page,
    limit,
  });

  const logs = result.logs || [];
  const total = result.total || 0;

  return <EmailLogsClient initialLogs={logs} total={total} currentPage={page} limit={limit} />;
}
