/**
 * Unsubscribe Client Component
 * Handles unsubscribe form submission
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail } from "lucide-react";
import { unsubscribeAction } from "@/app/actions/unsubscribe";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UnsubscribeTokenData {
  email: string;
  campaignId?: string;
  timestamp: number;
}

interface UnsubscribeClientProps {
  tokenData: UnsubscribeTokenData;
}

export function UnsubscribeClient({ tokenData }: UnsubscribeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  const handleUnsubscribe = () => {
    startTransition(async () => {
      const result = await unsubscribeAction({
        email: tokenData.email,
        campaignId: tokenData.campaignId,
        reason: reason || undefined,
      });

      if (result.success) {
        setIsUnsubscribed(true);
        toast.success("Successfully unsubscribed");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to unsubscribe");
      }
    });
  };

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">You're Unsubscribed</h2>
                <p className="text-muted-foreground mt-2">
                  You have been successfully unsubscribed from our emails.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  We're sorry to see you go. You won't receive any more emails from us.
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
              <CardTitle>Unsubscribe</CardTitle>
              <CardDescription>
                We're sorry to see you go
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              You are about to unsubscribe <strong>{tokenData.email}</strong> from our emails.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. You will no longer receive emails from us.
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Help us improve by telling us why you're unsubscribing..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
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
              variant="destructive"
              className="flex-1"
              onClick={handleUnsubscribe}
              disabled={isPending}
            >
              {isPending ? "Unsubscribing..." : "Unsubscribe"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

