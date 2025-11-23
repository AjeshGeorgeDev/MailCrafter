/**
 * Segment Detail Page
 * View segment details and matching contacts
 */

export const dynamic = 'force-dynamic';

import { getSegmentByIdAction, previewSegmentAction } from "@/app/actions/segments";
import { notFound } from "next/navigation";
import { SegmentDetailClient } from "./SegmentDetailClient";

export default async function SegmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const segmentResult = await getSegmentByIdAction(params.id);

  if (!segmentResult.success || !segmentResult.segment) {
    notFound();
  }

  const previewResult = await previewSegmentAction(params.id, {
    limit: 50,
    offset: 0,
  });

  const contacts = previewResult.contacts || [];

  return (
    <SegmentDetailClient
      segment={segmentResult.segment}
      initialContacts={contacts}
      totalContacts={segmentResult.segment.contactCount}
    />
  );
}

