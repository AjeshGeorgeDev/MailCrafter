/**
 * Analytics Client Component
 * Displays analytics dashboard with charts and metrics
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Mail, MousePointerClick, Users, Send, Download } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { format } from "date-fns";
import { exportOrganizationAnalyticsCSV } from "@/app/actions/analytics-export";
import { toast } from "sonner";

interface OrganizationStats {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalSubscribers: number;
  activeCampaigns: number;
}

interface TopCampaign {
  id: string;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
}

interface AnalyticsClientProps {
  initialStats: OrganizationStats | null;
  initialTopCampaigns: TopCampaign[];
}

export function AnalyticsClient({
  initialStats,
  initialTopCampaigns,
}: AnalyticsClientProps) {
  const [isPending, startTransition] = useTransition();
  const stats = initialStats || {
    totalCampaigns: 0,
    totalSent: 0,
    totalDelivered: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    totalSubscribers: 0,
    activeCampaigns: 0,
  };

  const metrics = [
    {
      title: "Total Emails Sent",
      value: stats.totalSent.toLocaleString(),
      change: "+0%",
      trend: "up" as const,
      icon: Send,
    },
    {
      title: "Average Open Rate",
      value: `${stats.averageOpenRate.toFixed(1)}%`,
      change: "+0%",
      trend: "up" as const,
      icon: Mail,
    },
    {
      title: "Average Click Rate",
      value: `${stats.averageClickRate.toFixed(1)}%`,
      change: "+0%",
      trend: "up" as const,
      icon: MousePointerClick,
    },
    {
      title: "Total Subscribers",
      value: stats.totalSubscribers.toLocaleString(),
      change: "+0",
      trend: "up" as const,
      icon: Users,
    },
  ];

  // Prepare chart data for top campaigns
  const campaignChartData = initialTopCampaigns.slice(0, 5).map((campaign) => ({
    name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + "..." : campaign.name,
    openRate: campaign.openRate,
    clickRate: campaign.clickRate,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your email campaign performance and insights
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            startTransition(async () => {
              const result = await exportOrganizationAnalyticsCSV();
              if (result.success && result.csv) {
                const blob = new Blob([result.csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename || "analytics.csv";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success("Analytics exported successfully");
              } else {
                toast.error(result.error || "Failed to export analytics");
              }
            });
          }}
          disabled={isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div
                  className={`flex items-center text-xs mt-1 ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <TrendIcon className="mr-1 h-3 w-3" />
                  {metric.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Campaigns Performance</CardTitle>
            <CardDescription>Open and click rates by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="openRate" fill="#8884d8" name="Open Rate %" />
                  <Bar dataKey="clickRate" fill="#82ca9d" name="Click Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No campaign data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
            <CardDescription>Summary statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Campaigns</span>
                <span className="text-lg font-semibold">{stats.totalCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Campaigns</span>
                <span className="text-lg font-semibold">{stats.activeCampaigns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Delivered</span>
                <span className="text-lg font-semibold">
                  {stats.totalDelivered.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivery Rate</span>
                <span className="text-lg font-semibold">
                  {stats.totalSent > 0
                    ? `${((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Campaigns with best engagement rates</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/campaigns">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {initialTopCampaigns.length > 0 ? (
            <div className="space-y-4">
              {initialTopCampaigns.slice(0, 5).map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sent.toLocaleString()} emails sent
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{campaign.openRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Open rate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{campaign.clickRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Click rate</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No campaigns yet</p>
              <Button asChild>
                <Link href="/dashboard/campaigns/new">Create Your First Campaign</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

