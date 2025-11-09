/**
 * Audit Log Page
 * View organization audit logs
 */

export const dynamic = 'force-dynamic';

import { getAuditLogsAction } from "@/app/actions/audit-logs";
import { AuditLogClient } from "./AuditLogClient";
import { redirect } from "next/navigation";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(searchParams.page as string) || 1;
  const action = searchParams.action as string | undefined;
  const resource = searchParams.resource as string | undefined;

  const result = await getAuditLogsAction({
    action: action as any,
    resource: resource as any,
    page,
    limit: 50,
  });

  if (!result.success) {
    redirect("/dashboard");
  }

  return (
    <AuditLogClient
      initialLogs={result.logs || []}
      total={result.total || 0}
      currentPage={page}
    />
  );
}

