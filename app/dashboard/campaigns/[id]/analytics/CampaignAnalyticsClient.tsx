/**
 * Campaign Analytics Client Component
 * Displays detailed analytics for a campaign
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Mail, MousePointerClick, Send, AlertCircle, Users, Download } from "lucide-react";
import Link from "next/link";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import {
  exportCampaignAnalyticsCSV,
  exportCampaignAnalyticsExcel,
} from "@/app/actions/analytics-export";
import { toast } from "sonner";

interface CampaignStats {
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalFailed: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  unsubscribeCount: number;
  unsubscribeRate: number;
}

interface EngagementTrend {
  date: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  createdAt: Date;
}

interface CampaignAnalyticsClientProps {
  campaign: Campaign;
  stats: CampaignStats | null;
  trends: EngagementTrend[];
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export function CampaignAnalyticsClient({
  campaign,
  stats,
  trends,
}: CampaignAnalyticsClientProps) {
  const [isPending, startTransition] = useTransition();
  const campaignStats = stats || {
    totalSent: 0,
    totalDelivered: 0,
    totalBounced: 0,
    totalFailed: 0,
    uniqueOpens: 0,
    uniqueClicks: 0,
    totalOpens: 0,
    totalClicks: 0,
    openRate: 0,
    clickRate: 0,
    clickToOpenRate: 0,
    bounceRate: 0,
    unsubscribeCount: 0,
    unsubscribeRate: 0,
  };

  // Prepare pie chart data for delivery status
  const deliveryData = [
    { name: "Delivered", value: campaignStats.totalDelivered },
    { name: "Bounced", value: campaignStats.totalBounced },
    { name: "Failed", value: campaignStats.totalFailed },
  ].filter((item) => item.value > 0);

  // Format trends for chart
  const formattedTrends = trends.map((trend) => ({
    ...trend,
    date: format(new Date(trend.date), "MMM d"),
  }));

  const metrics = [
    {
      title: "Total Sent",
      value: campaignStats.totalSent.toLocaleString(),
      icon: Send,
      color: "text-blue-600",
    },
    {
      title: "Delivered",
      value: campaignStats.totalDelivered.toLocaleString(),
      icon: Mail,
      color: "text-green-600",
    },
    {
      title: "Unique Opens",
      value: campaignStats.uniqueOpens.toLocaleString(),
      icon: Mail,
      color: "text-purple-600",
    },
    {
      title: "Unique Clicks",
      value: campaignStats.uniqueClicks.toLocaleString(),
      icon: MousePointerClick,
      color: "text-orange-600",
    },
    {
      title: "Bounced",
      value: campaignStats.totalBounced.toLocaleString(),
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Unsubscribed",
      value: campaignStats.unsubscribeCount.toLocaleString(),
      icon: Users,
      color: "text-gray-600",
    },
  ];

  const rates = [
    {
      title: "Open Rate",
      value: `${campaignStats.openRate.toFixed(2)}%`,
      description: `${campaignStats.uniqueOpens} unique opens`,
    },
    {
      title: "Click Rate",
      value: `${campaignStats.clickRate.toFixed(2)}%`,
      description: `${campaignStats.uniqueClicks} unique clicks`,
    },
    {
      title: "Click-to-Open Rate",
      value: `${campaignStats.clickToOpenRate.toFixed(2)}%`,
      description: "Clicks per open",
    },
    {
      title: "Bounce Rate",
      value: `${campaignStats.bounceRate.toFixed(2)}%`,
      description: `${campaignStats.totalBounced} bounces`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/campaigns/${campaign.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground">Campaign Analytics & Performance</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={isPending}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                startTransition(async () => {
                  const result = await exportCampaignAnalyticsCSV(campaign.id);
                  if (result.success && result.csv) {
                    const blob = new Blob([result.csv], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = result.filename || "campaign-analytics.csv";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Campaign analytics exported to CSV");
                  } else {
                    toast.error(result.error || "Failed to export");
                  }
                });
              }}
            >
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                startTransition(async () => {
                  const result = await exportCampaignAnalyticsExcel(campaign.id);
                  if (result.success && result.buffer) {
                    const binaryString = atob(result.buffer);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], {
                      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = result.filename || "campaign-analytics.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Campaign analytics exported to Excel");
                  } else {
                    toast.error(result.error || "Failed to export");
                  }
                });
              }}
            >
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Rates */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {rates.map((rate) => (
          <Card key={rate.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{rate.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rate.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{rate.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Opens and clicks over time</CardDescription>
          </CardHeader>
          <CardContent>
            {formattedTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="opens"
                    stroke="#8884d8"
                    name="Opens"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#82ca9d"
                    name="Clicks"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No engagement data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
            <CardDescription>Email delivery breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deliveryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const name = props.name || '';
                      const percent = typeof props.percent === 'number' ? props.percent : 0;
                      return `${name} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deliveryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No delivery data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Statistics</CardTitle>
          <CardDescription>Comprehensive campaign metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Opens</span>
                <span className="font-medium">{campaignStats.totalOpens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Clicks</span>
                <span className="font-medium">{campaignStats.totalClicks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="font-medium">{campaignStats.totalFailed.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unsubscribe Rate</span>
                <span className="font-medium">
                  {campaignStats.unsubscribeRate.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Campaign Status</span>
                <span className="font-medium">{campaign.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="font-medium">
                  {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

