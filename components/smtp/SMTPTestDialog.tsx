/**
 * SMTP Test Dialog Component
 * Tests SMTP connection and optionally sends test email
 */

"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Mail, TestTube } from "lucide-react";
import { testSMTPConnectionByProfile, sendSMTPTestEmail } from "@/app/actions/smtp-test";
import { toast } from "sonner";

interface SMTPTestResult {
  success: boolean;
  connectionTime: number;
  authentication: "success" | "failed" | "not_tested";
  ssl: {
    valid: boolean;
    issuer: string | null;
    expiresAt: Date | null;
  };
  error?: string;
  details: string;
}

interface SMTPTestDialogProps {
  profileId: string;
  profileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SMTPTestDialog({
  profileId,
  profileName,
  open,
  onOpenChange,
}: SMTPTestDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [testResult, setTestResult] = useState<SMTPTestResult | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleTest = () => {
    setTestResult(null);
    setEmailSent(false);
    
    startTransition(async () => {
      const result = await testSMTPConnectionByProfile(profileId);
      
      if (result.success && result.result) {
        setTestResult(result.result);
        if (result.result.success) {
          toast.success("Connection test successful");
        } else {
          toast.error("Connection test failed");
        }
      } else {
        toast.error(result.error || "Failed to test connection");
        setTestResult({
          success: false,
          connectionTime: 0,
          authentication: "not_tested",
          ssl: { valid: false, issuer: null, expiresAt: null },
          error: result.error || "Unknown error",
          details: "Failed to test connection",
        });
      }
    });
  };

  const handleSendTestEmail = () => {
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSendingEmail(true);
    setEmailSent(false);

    startTransition(async () => {
      const result = await sendSMTPTestEmail(profileId, testEmailAddress);
      
      if (result.success) {
        setEmailSent(true);
        toast.success("Test email sent successfully");
      } else {
        toast.error(result.error || "Failed to send test email");
      }
      
      setIsSendingEmail(false);
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a delay to allow dialog to close
    setTimeout(() => {
      setTestResult(null);
      setTestEmailAddress("");
      setEmailSent(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test SMTP Connection</DialogTitle>
          <DialogDescription>
            Test the connection for: <strong>{profileName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Connection Button */}
          <div>
            <Button
              onClick={handleTest}
              disabled={isPending}
              className="w-full"
              variant="default"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <Alert
              variant={testResult.success ? "default" : "destructive"}
              className={testResult.success ? "border-green-500 bg-green-50" : ""}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <AlertDescription className="font-medium">
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </AlertDescription>
                  <div className="text-sm space-y-1">
                    <p>{testResult.details}</p>
                    {testResult.connectionTime > 0 && (
                      <p className="text-muted-foreground">
                        Connection time: {testResult.connectionTime}ms
                      </p>
                    )}
                    {testResult.authentication !== "not_tested" && (
                      <p className="text-muted-foreground">
                        Authentication: {testResult.authentication === "success" ? "✓ Success" : "✗ Failed"}
                      </p>
                    )}
                    {testResult.ssl.valid && (
                      <p className="text-muted-foreground">
                        SSL/TLS: ✓ Valid
                      </p>
                    )}
                    {testResult.error && (
                      <p className="text-red-600 font-medium">{testResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {/* Send Test Email Section */}
          {testResult?.success && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="testEmail">Send Test Email</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Send a test email to verify your SMTP configuration works end-to-end
                </p>
                <div className="flex gap-2">
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="your-email@example.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    disabled={isSendingEmail || emailSent}
                  />
                  <Button
                    onClick={handleSendTestEmail}
                    disabled={isSendingEmail || emailSent || !testEmailAddress}
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : emailSent ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Sent
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                {emailSent && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Test email sent successfully! Check your inbox.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

