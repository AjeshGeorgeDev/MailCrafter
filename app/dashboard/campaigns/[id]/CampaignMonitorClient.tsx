/**
 * Campaign Monitor Client Component
 * Displays campaign details, progress, and controls
 */

"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Pause, Play, X, Send } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  template: {
    id: string;
    name: string;
  };
}

interface CampaignStats {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalFailed: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
}

interface CampaignMonitorClientProps {
  campaign: Campaign;
  stats: CampaignStats | null;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  SENDING: "bg-yellow-100 text-yellow-800",
  PAUSED: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export function CampaignMonitorClient({
  campaign,
  stats,
}: CampaignMonitorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Auto-refresh for active campaigns
  useEffect(() => {
    if (campaign.status === "SENDING") {
      const interval = setInterval(() => {
        router.refresh();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [campaign.status, router]);

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.subject}</p>
        </div>
        <Badge className={getStatusColor(campaign.status)}>
          {campaign.status}
        </Badge>
      </div>

      {/* Progress Card */}
      {campaign.status === "SENDING" && (
        <Card>
          <CardHeader>
            <CardTitle>Sending Progress</CardTitle>
            <CardDescription>
              Campaign is currently being sent to recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {campaign.sentCount} / {campaign.recipientCount} sent
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${campaign.progress}%` }}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={isPending}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button variant="outline" size="sm" disabled={isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSent || campaign.sentCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalDelivered || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.openRate.toFixed(1) || "0.0"}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.clickRate.toFixed(1) || "0.0"}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Template</span>
              <span className="text-sm font-medium">{campaign.template.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Recipients</span>
              <span className="text-sm font-medium">
                {campaign.recipientCount.toLocaleString()}
              </span>
            </div>
            {campaign.scheduledAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scheduled</span>
                <span className="text-sm font-medium">
                  {format(new Date(campaign.scheduledAt), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            )}
            {campaign.startedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Started</span>
                <span className="text-sm font-medium">
                  {format(new Date(campaign.startedAt), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            )}
            {campaign.completedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm font-medium">
                  {format(new Date(campaign.completedAt), "MMM d, yyyy HH:mm")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm font-medium">
                {format(new Date(campaign.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/dashboard/campaigns/${campaign.id}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
            {campaign.status === "DRAFT" && (
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                  Edit Campaign
                </Link>
              </Button>
            )}
            {campaign.status === "PAUSED" && (
              <Button variant="outline" className="w-full justify-start" disabled={isPending}>
                <Play className="mr-2 h-4 w-4" />
                Resume Sending
              </Button>
            )}
            {campaign.status === "SCHEDULED" && (
              <Button variant="outline" className="w-full justify-start" disabled={isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancel Schedule
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

