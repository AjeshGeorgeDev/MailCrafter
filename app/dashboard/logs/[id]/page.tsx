/**
 * Email Log Details Page
 * View detailed information about a specific email log
 */

import { getEmailLogDetailsAction } from "@/app/actions/email-logs";
import { EmailLogDetailsClient } from "./EmailLogDetailsClient";
import { notFound } from "next/navigation";

export default async function EmailLogDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getEmailLogDetailsAction(params.id);

  if (result.error || !result.emailLog) {
    notFound();
  }

  return <EmailLogDetailsClient emailLog={result.emailLog} />;
}

