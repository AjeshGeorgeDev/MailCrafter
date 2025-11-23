/**
 * Segment Form Dialog
 * Create and edit segments with rules builder
 */

"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentRulesBuilder } from "./SegmentRulesBuilder";
import { createSegmentAction, updateSegmentAction } from "@/app/actions/segments";
import { toast } from "sonner";
import type { SegmentCondition, SegmentRule } from "@/lib/segments/segment-evaluator";

interface Segment {
  id: string;
  name: string;
  conditions: any;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment?: Segment | null;
  onSuccess?: (createdOrUpdated?: boolean) => void;
}

export function SegmentFormDialog({
  open,
  onOpenChange,
  segment,
  onSuccess,
}: SegmentFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(segment?.name || "");
  const [conditions, setConditions] = useState<SegmentRule[]>(
    segment?.conditions?.rules || segment?.conditions?.conditions
      ? segment.conditions.rules || [{ conditions: segment.conditions.conditions || [], logic: "AND" }]
      : [{ conditions: [], logic: "AND" }]
  );
  const [logic, setLogic] = useState<"AND" | "OR">(
    segment?.conditions?.logic || "AND"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Segment name is required");
      return;
    }

    // Build conditions structure
    const conditionsData = {
      rules: conditions,
      logic,
    };

    startTransition(async () => {
      if (segment) {
        // Update existing segment
        const result = await updateSegmentAction(segment.id, {
          name,
          conditions: conditionsData,
        });

        if (result.success) {
          toast.success("Segment updated successfully");
          onSuccess?.(true);
          onOpenChange(false);
        } else {
          toast.error(result.error || "Failed to update segment");
        }
      } else {
        // Create new segment
        const result = await createSegmentAction({
          name,
          conditions: conditionsData,
        });

        if (result.success) {
          toast.success("Segment created successfully");
          onSuccess?.(true);
          onOpenChange(false);
          // Reset form
          setName("");
          setConditions([{ conditions: [], logic: "AND" }]);
          setLogic("AND");
        } else {
          toast.error(result.error || "Failed to create segment");
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{segment ? "Edit Segment" : "Create Segment"}</DialogTitle>
          <DialogDescription>
            {segment
              ? "Update your segment name and conditions"
              : "Create a new segment by defining conditions that contacts must match"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Segment Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Active Subscribers, VIP Customers"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Conditions</Label>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-normal">Match:</Label>
                <select
                  value={logic}
                  onChange={(e) => setLogic(e.target.value as "AND" | "OR")}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option value="AND">All conditions (AND)</option>
                  <option value="OR">Any condition (OR)</option>
                </select>
              </div>
            </div>

            <SegmentRulesBuilder
              rules={conditions}
              onRulesChange={setConditions}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : segment ? "Update Segment" : "Create Segment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

