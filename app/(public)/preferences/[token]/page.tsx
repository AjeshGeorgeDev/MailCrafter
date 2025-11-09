/**
 * Preference Center Page
 * Public page for users to manage email preferences
 */

import { decryptUnsubscribeToken } from "@/lib/email/unsubscribe";
import { PreferenceCenterClient } from "./PreferenceCenterClient";
import { notFound } from "next/navigation";

export default async function PreferenceCenterPage({
  params,
}: {
  params: { token: string };
}) {
  const tokenData = decryptUnsubscribeToken(params.token);

  if (!tokenData) {
    notFound();
  }

  return <PreferenceCenterClient tokenData={tokenData} />;
}

