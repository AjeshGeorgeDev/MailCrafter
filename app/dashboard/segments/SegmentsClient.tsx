/**
 * Segments Client Component
 * Handles client-side interactions for segments list
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, MoreVertical, Edit, Trash2, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteSegmentAction, refreshSegmentCountAction } from "@/app/actions/segments";
import { toast } from "sonner";
import { SegmentFormDialog } from "./SegmentFormDialog";
import { format } from "date-fns";

interface Segment {
  id: string;
  name: string;
  conditions: any;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentsClientProps {
  initialSegments: Segment[];
}

export function SegmentsClient({ initialSegments }: SegmentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  const filteredSegments = segments.filter((segment) =>
    segment.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSegmentAction(id);
      if (result.success) {
        toast.success("Segment deleted successfully");
        setSegments(segments.filter((s) => s.id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete segment");
      }
    });
  };

  const handleRefreshCount = (id: string) => {
    startTransition(async () => {
      const result = await refreshSegmentCountAction(id);
      if (result.success) {
        toast.success("Segment count refreshed");
        setSegments(
          segments.map((s) =>
            s.id === id ? { ...s, contactCount: result.contactCount || 0 } : s
          )
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to refresh segment count");
      }
    });
  };

  const handleEdit = (segment: Segment) => {
    setEditingSegment(segment);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSegment(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (createdOrUpdated?: boolean) => {
    setIsDialogOpen(false);
    setEditingSegment(null);
    if (createdOrUpdated) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground">
            Create and manage contact segments for targeted campaigns
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Create Segment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Segments</CardTitle>
              <CardDescription>
                Manage your contact segments ({segments.length} total)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search segments..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSegments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {search ? "No segments found" : "No segments yet"}
              </p>
              {!search && (
                <Button onClick={handleCreate} disabled={isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Segment
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSegments.map((segment) => (
                <Card key={segment.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {segment.contactCount} contacts
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(segment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRefreshCount(segment.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Count
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(segment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Created {format(new Date(segment.createdAt), "MMM d, yyyy")}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/segments/${segment.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SegmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        segment={editingSegment}
        onSuccess={handleDialogClose}
      />
    </div>
  );
}

