/**
 * Campaigns Client Component
 * Handles client-side interactions for campaigns list
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Calendar, BarChart3, Send, MoreVertical } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCampaign, duplicateCampaign } from "@/app/actions/campaigns";
import { toast } from "sonner";
import { useTransition } from "react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  progress: number;
  scheduledAt: Date | null;
  createdAt: Date;
  template: {
    id: string;
    name: string;
  };
  smtpProfile: {
    id: string;
    name: string;
  } | null;
}

interface CampaignsClientProps {
  initialCampaigns: Campaign[];
  total: number;
  currentPage: number;
}

export function CampaignsClient({
  initialCampaigns,
  total,
  currentPage,
}: CampaignsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENDING":
        return "bg-blue-100 text-blue-800";
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "PAUSED":
        return "bg-orange-100 text-orange-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/dashboard/campaigns?${params.toString()}`);
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
    router.push(`/dashboard/campaigns?${params.toString()}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCampaign(id);
      if (result.success) {
        toast.success("Campaign deleted successfully");
        setCampaigns(campaigns.filter((c) => c.id !== id));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete campaign");
      }
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const result = await duplicateCampaign(id);
      if (result.success && result.campaign) {
        toast.success("Campaign duplicated successfully");
        router.push(`/dashboard/campaigns/${result.campaign.id}`);
      } else {
        toast.error(result.error || "Failed to duplicate campaign");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your email campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Campaigns</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search campaigns..."
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No campaigns found</p>
              <Button asChild>
                <Link href="/dashboard/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {campaign.subject}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/campaigns/${campaign.id}`}>View</Link>
                          </DropdownMenuItem>
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/campaigns/${campaign.id}`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(campaign.id)}
                          >
                            Duplicate
                          </DropdownMenuItem>
                          {campaign.status === "DRAFT" && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      {campaign.recipientCount > 0 && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Sent</span>
                            <span className="font-medium">
                              {campaign.sentCount} / {campaign.recipientCount}
                            </span>
                          </div>
                          {campaign.status === "SENDING" && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{Math.round(campaign.progress)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${campaign.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {campaign.scheduledAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(campaign.scheduledAt), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/campaigns/${campaign.id}`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        {campaign.status === "SCHEDULED" && (
                          <Button variant="outline" size="sm" className="flex-1">
                            <Send className="mr-2 h-4 w-4" />
                            Send Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

