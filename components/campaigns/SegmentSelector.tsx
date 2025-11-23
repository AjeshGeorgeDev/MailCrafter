/**
 * Segment Selector Component
 * Select a segment to add its contacts as campaign recipients
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Check } from "lucide-react";
import { getSegmentsAction } from "@/app/actions/segments";
import { toast } from "sonner";

interface Segment {
  id: string;
  name: string;
  contactCount: number;
}

interface SegmentSelectorProps {
  onSegmentSelect: (segmentId: string, contactCount: number) => void;
  selectedSegmentId?: string | null;
}

export function SegmentSelector({
  onSegmentSelect,
  selectedSegmentId,
}: SegmentSelectorProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>(
    selectedSegmentId || ""
  );

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const result = await getSegmentsAction();
      if (result.success && result.segments) {
        setSegments(result.segments);
      } else {
        toast.error(result.error || "Failed to load segments");
      }
    } catch (error) {
      console.error("Error loading segments:", error);
      toast.error("Failed to load segments");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (segmentId: string) => {
    setSelectedSegment(segmentId);
    const segment = segments.find((s) => s.id === segmentId);
    if (segment) {
      onSegmentSelect(segmentId, segment.contactCount);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading segments...</p>
        </CardContent>
      </Card>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Segment</CardTitle>
          <CardDescription>
            No segments available. Create a segment first to use it here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.open("/dashboard/segments", "_blank")}
          >
            <Users className="mr-2 h-4 w-4" />
            Create Segment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Select Segment</CardTitle>
        <CardDescription>
          Choose a segment to add its contacts as campaign recipients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedSegment} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a segment..." />
          </SelectTrigger>
          <SelectContent>
            {segments.map((segment) => (
              <SelectItem key={segment.id} value={segment.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{segment.name}</span>
                  <span className="ml-4 text-xs text-muted-foreground">
                    ({segment.contactCount} contacts)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSegment && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium">
                  {
                    segments.find((s) => s.id === selectedSegment)
                      ?.name
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {
                    segments.find((s) => s.id === selectedSegment)
                      ?.contactCount
                  }{" "}
                  contacts will be added to this campaign
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

