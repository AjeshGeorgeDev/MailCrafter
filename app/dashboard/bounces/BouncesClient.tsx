/**
 * Bounces Client Component
 * Handles client-side interactions for bounce management
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { removeEmailFromSuppression } from "@/app/actions/bounces";
import { toast } from "sonner";

interface BounceRecord {
  email: string;
  bounceType: "HARD" | "SOFT";
  bounceReason: string | null;
  bounceCount: number;
  firstBouncedAt: Date;
  lastBouncedAt: Date;
  isSuppressed: boolean;
}

interface BouncesClientProps {
  initialBounces: BounceRecord[];
  total: number;
  currentPage: number;
}

export function BouncesClient({
  initialBounces,
  total,
  currentPage,
}: BouncesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [bounces, setBounces] = useState<BounceRecord[]>(initialBounces);
  const [bounceTypeFilter, setBounceTypeFilter] = useState(
    searchParams.get("bounceType") || "all"
  );
  const [suppressedFilter, setSuppressedFilter] = useState(
    searchParams.get("suppressed") || "all"
  );

  const handleRemoveFromSuppression = (email: string) => {
    if (!confirm(`Remove ${email} from suppression list?`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeEmailFromSuppression(email);
      if (result.success) {
        toast.success("Email removed from suppression list");
        setBounces(
          bounces.map((b) => (b.email === email ? { ...b, isSuppressed: false } : b))
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove from suppression");
      }
    });
  };

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set("page", "1");
    router.push(`/dashboard/bounces?${params.toString()}`);
  };

  const getBounceTypeColor = (type: string) => {
    return type === "HARD" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bounce Management</h1>
        <p className="text-muted-foreground">
          View and manage bounced email addresses
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bounced Emails</CardTitle>
              <CardDescription>
                {total} total bounce{total !== 1 ? "s" : ""} recorded
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={bounceTypeFilter}
                onValueChange={(value) => {
                  setBounceTypeFilter(value);
                  handleFilterChange("bounceType", value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="HARD">Hard Bounces</SelectItem>
                  <SelectItem value="SOFT">Soft Bounces</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={suppressedFilter}
                onValueChange={(value) => {
                  setSuppressedFilter(value);
                  handleFilterChange("suppressed", value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="true">Suppressed Only</SelectItem>
                  <SelectItem value="false">Not Suppressed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bounces.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No bounce records found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Bounce Type</TableHead>
                  <TableHead>Bounce Count</TableHead>
                  <TableHead>First Bounced</TableHead>
                  <TableHead>Last Bounced</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bounces.map((bounce) => (
                  <TableRow key={bounce.email}>
                    <TableCell className="font-medium">{bounce.email}</TableCell>
                    <TableCell>
                      <Badge className={getBounceTypeColor(bounce.bounceType)}>
                        {bounce.bounceType}
                      </Badge>
                    </TableCell>
                    <TableCell>{bounce.bounceCount}</TableCell>
                    <TableCell>
                      {format(new Date(bounce.firstBouncedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(bounce.lastBouncedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {bounce.isSuppressed ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          Suppressed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {bounce.isSuppressed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromSuppression(bounce.email)}
                          disabled={isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Remove Suppression
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

