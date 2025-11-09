/**
 * Bounce Management Page
 * View and manage bounced emails
 */

export const dynamic = 'force-dynamic';

import { getBounceRecords } from "@/app/actions/bounces";
import { BouncesClient } from "./BouncesClient";

export default async function BouncesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(searchParams.page as string) || 1;
  const bounceType = searchParams.bounceType as "HARD" | "SOFT" | undefined;
  const isSuppressed = searchParams.suppressed === "true" ? true : undefined;

  const result = await getBounceRecords({
    bounceType,
    isSuppressed,
    page,
    limit: 50,
  });

  const bounces = result.bounces || [];
  const total = result.total || 0;

  return (
    <BouncesClient
      initialBounces={bounces}
      total={total}
      currentPage={page}
    />
  );
}

