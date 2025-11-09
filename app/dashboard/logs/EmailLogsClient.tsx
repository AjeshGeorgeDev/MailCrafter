/**
 * Email Logs Client Component
 * Handles client-side interactions for email logs
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Filter, Eye } from "lucide-react";
import { getEmailLogsAction, exportEmailLogs } from "@/app/actions/email-logs";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface EmailLog {
  id: string;
  recipientEmail: string;
  templateId: string;
  campaignId: string | null;
  status: string;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  campaign: {
    id: string;
    name: string;
  } | null;
  events: Array<{
    eventType: string;
    timestamp: Date;
  }>;
}

interface EmailLogsClientProps {
  initialLogs: EmailLog[];
  total: number;
  currentPage: number;
  limit: number;
}

export function EmailLogsClient({
  initialLogs,
  total,
  currentPage,
  limit,
}: EmailLogsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<EmailLog[]>(initialLogs);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "SENT":
        return "bg-blue-100 text-blue-800";
      case "BOUNCED":
        return "bg-red-100 text-red-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "QUEUED":
        return "bg-yellow-100 text-yellow-800";
      case "SENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const hasOpened = (log: EmailLog) => {
    return log.events.some((e) => e.eventType === "OPENED");
  };

  const hasClicked = (log: EmailLog) => {
    return log.events.some((e) => e.eventType === "CLICKED");
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/dashboard/logs?${params.toString()}`);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`/dashboard/logs?${params.toString()}`);
  };

  const handleExport = () => {
    startTransition(async () => {
      const params = new URLSearchParams(searchParams.toString());
      const result = await exportEmailLogs({
        campaignId: params.get("campaignId") || undefined,
        templateId: params.get("templateId") || undefined,
        status: params.get("status") || undefined,
        startDate: params.get("startDate") || undefined,
        endDate: params.get("endDate") || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Download CSV
      const blob = new Blob([result.csv || ""], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Email logs exported successfully");
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Logs</h1>
          <p className="text-muted-foreground">
            View email delivery logs and tracking data
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Delivery Logs</CardTitle>
              <CardDescription>
                Track the status of all sent emails ({total} total)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by email..."
                  className="pl-8 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="QUEUED">Queued</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="BOUNCED">Bounced</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSearch}>
                <Filter className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No email logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.recipientEmail}
                      </TableCell>
                      <TableCell>
                        {log.campaign?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.sentAt
                          ? format(new Date(log.sentAt), "MMM d, yyyy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {log.deliveredAt
                          ? format(new Date(log.deliveredAt), "MMM d, yyyy HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {hasOpened(log) ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasClicked(log) ? (
                          <Badge
                            variant="default"
                            className="bg-blue-100 text-blue-800"
                          >
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/logs/${log.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to{" "}
                    {Math.min(currentPage * limit, total)} of {total} logs
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(currentPage - 1));
                        router.push(`/dashboard/logs?${params.toString()}`);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(currentPage + 1));
                        router.push(`/dashboard/logs?${params.toString()}`);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

