/**
 * Segments Page
 * List all segments with filters and search
 */

export const dynamic = 'force-dynamic';

import { getSegmentsAction } from "@/app/actions/segments";
import { SegmentsClient } from "./SegmentsClient";

export default async function SegmentsPage() {
  const result = await getSegmentsAction();

  const segments = result.segments || [];

  return (
    <SegmentsClient
      initialSegments={segments}
    />
  );
}

