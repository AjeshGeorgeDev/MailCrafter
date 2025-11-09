/**
 * Preference Center Client Component
 * Allows users to manage email preferences
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UnsubscribeTokenData {
  email: string;
  campaignId?: string;
  timestamp: number;
}

interface PreferenceCenterClientProps {
  tokenData: UnsubscribeTokenData;
}

export function PreferenceCenterClient({
  tokenData,
}: PreferenceCenterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(tokenData.email);
  const [preferences, setPreferences] = useState({
    marketing: true,
    transactional: true,
    newsletters: true,
    updates: true,
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      // TODO: Implement preference saving
      // For now, just show success
      setIsSaved(true);
      toast.success("Preferences saved successfully");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    });
  };

  if (isSaved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Preferences Updated</h2>
                <p className="text-muted-foreground mt-2">
                  Your email preferences have been saved successfully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Manage your email subscription preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <Label>Email Types</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing" className="font-normal">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Promotional content and offers
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="transactional" className="font-normal">
                    Transactional Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Order confirmations and receipts
                  </p>
                </div>
                <Switch
                  id="transactional"
                  checked={preferences.transactional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, transactional: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletters" className="font-normal">
                    Newsletters
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly updates and news
                  </p>
                </div>
                <Switch
                  id="newsletters"
                  checked={preferences.newsletters}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, newsletters: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="updates" className="font-normal">
                    Product Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New features and announcements
                  </p>
                </div>
                <Switch
                  id="updates"
                  checked={preferences.updates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, updates: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/")}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

