/**
 * Unsubscribe Page
 * Public page for users to unsubscribe from emails
 */

import { decryptUnsubscribeToken } from "@/lib/email/unsubscribe";
import { UnsubscribeClient } from "./UnsubscribeClient";
import { notFound } from "next/navigation";

export default async function UnsubscribePage({
  params,
}: {
  params: { token: string };
}) {
  const tokenData = decryptUnsubscribeToken(params.token);

  if (!tokenData) {
    notFound();
  }

  return <UnsubscribeClient tokenData={tokenData} />;
}

