"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, XCircle, Mail, Send, AlertCircle } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
  metadata: any;
}

export function NotificationsSettings() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Notification preferences (can be stored in database later)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    campaignAlerts: true,
    emailBounces: true,
    campaignCompleted: true,
    campaignFailed: true,
    templateUpdated: false,
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await getNotifications(50); // Get more for the settings page
      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        toast.error(result.error || "Failed to mark notification as read");
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error || "Failed to mark all as read");
      }
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "campaign_completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "campaign_failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "email_bounced":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "template_updated":
        return <Mail className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important events
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="campaign-alerts">Campaign Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when campaigns complete or fail
              </p>
            </div>
            <Switch
              id="campaign-alerts"
              checked={preferences.campaignAlerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, campaignAlerts: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="campaign-completed">Campaign Completed</Label>
              <p className="text-sm text-muted-foreground">
                Notify when campaigns finish sending
              </p>
            </div>
            <Switch
              id="campaign-completed"
              checked={preferences.campaignCompleted}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, campaignCompleted: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="campaign-failed">Campaign Failed</Label>
              <p className="text-sm text-muted-foreground">
                Notify when campaigns encounter errors
              </p>
            </div>
            <Switch
              id="campaign-failed"
              checked={preferences.campaignFailed}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, campaignFailed: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-bounces">Email Bounces</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about bounced emails
              </p>
            </div>
            <Switch
              id="email-bounces"
              checked={preferences.emailBounces}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailBounces: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="template-updated">Template Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notify when templates are updated by team members
              </p>
            </div>
            <Switch
              id="template-updated"
              checked={preferences.templateUpdated}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, templateUpdated: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View and manage your recent notifications
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see notifications here when events occur
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    !notification.isRead ? "bg-accent/50 border-primary/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

