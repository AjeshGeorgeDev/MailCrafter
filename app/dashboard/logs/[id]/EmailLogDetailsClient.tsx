/**
 * Email Log Details Client Component
 * Displays detailed information about an email log
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Calendar, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface EmailEvent {
  id: string;
  eventType: string;
  metadata: any;
  timestamp: Date;
}

interface EmailLog {
  id: string;
  recipientEmail: string;
  templateId: string;
  campaignId: string | null;
  languageCode: string;
  status: string;
  smtpResponse: string | null;
  errorMessage: string | null;
  retryCount: number;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  campaign: {
    id: string;
    name: string;
    status: string;
  } | null;
  template: {
    id: string;
    name: string;
  } | null;
  events: EmailEvent[];
}

interface EmailLogDetailsClientProps {
  emailLog: EmailLog;
}

export function EmailLogDetailsClient({ emailLog }: EmailLogDetailsClientProps) {
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "OPENED":
        return <Mail className="h-4 w-4 text-green-600" />;
      case "CLICKED":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "BOUNCED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/logs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Log Details</h1>
          <p className="text-muted-foreground">
            Detailed information about this email delivery
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Information */}
        <Card>
          <CardHeader>
            <CardTitle>Email Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Recipient</p>
              <p className="font-medium">{emailLog.recipientEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(emailLog.status)}>
                {emailLog.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">
                {emailLog.template?.name || emailLog.templateId}
              </p>
            </div>
            {emailLog.campaign && (
              <div>
                <p className="text-sm text-muted-foreground">Campaign</p>
                <p className="font-medium">{emailLog.campaign.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="font-medium">{emailLog.languageCode.toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(emailLog.createdAt), "MMM d, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>
            {emailLog.sentAt && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="font-medium">
                    {format(new Date(emailLog.sentAt), "MMM d, yyyy HH:mm:ss")}
                  </p>
                </div>
              </div>
            )}
            {emailLog.deliveredAt && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="font-medium">
                    {format(new Date(emailLog.deliveredAt), "MMM d, yyyy HH:mm:ss")}
                  </p>
                </div>
              </div>
            )}
            {emailLog.retryCount > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Retry Count</p>
                <p className="font-medium">{emailLog.retryCount}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            Tracking events for this email ({emailLog.events.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLog.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded yet</p>
          ) : (
            <div className="space-y-4">
              {emailLog.events.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-1">{getEventIcon(event.eventType)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.eventType}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), "MMM d, yyyy HH:mm:ss")}
                      </p>
                    </div>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Information */}
      {emailLog.errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{emailLog.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* SMTP Response */}
      {emailLog.smtpResponse && (
        <Card>
          <CardHeader>
            <CardTitle>SMTP Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {emailLog.smtpResponse}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

