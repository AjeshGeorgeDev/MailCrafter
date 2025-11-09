/**
 * DNS Verification Client Component
 * Displays DNS verification results and setup instructions
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Copy } from "lucide-react";
import { verifyDNSAction } from "@/app/actions/dns-verification";
import { toast } from "sonner";

interface DNSVerificationClientProps {
  initialDomains: string[];
}

interface DNSResult {
  domain: string;
  spf: {
    exists: boolean;
    record?: string;
    valid: boolean;
    errors?: string[];
  };
  dkim: {
    exists: boolean;
    record?: string;
    valid: boolean;
    selector?: string;
    errors?: string[];
  };
  dmarc: {
    exists: boolean;
    record?: string;
    valid: boolean;
    policy?: string;
    errors?: string[];
  };
  overall: "valid" | "partial" | "invalid";
}

export function DNSVerificationClient({
  initialDomains,
}: DNSVerificationClientProps) {
  const [isPending, startTransition] = useTransition();
  const [domain, setDomain] = useState(initialDomains[0] || "");
  const [result, setResult] = useState<DNSResult | null>(null);

  const handleVerify = () => {
    if (!domain) {
      toast.error("Please enter a domain");
      return;
    }

    startTransition(async () => {
      const response = await verifyDNSAction(domain);
      if (response.success && response.result) {
        setResult(response.result);
        toast.success("DNS verification completed");
      } else {
        toast.error(response.error || "Failed to verify DNS");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusIcon = (valid: boolean, exists: boolean) => {
    if (!exists) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
    return valid ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-yellow-600" />
    );
  };

  const getOverallBadgeColor = (overall: string) => {
    switch (overall) {
      case "valid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DNS Verification</h1>
        <p className="text-muted-foreground">
          Verify SPF, DKIM, and DMARC records for your email domains
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Domain</CardTitle>
          <CardDescription>
            Enter a domain or email address to check DNS records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="domain">Domain or Email</Label>
              <Input
                id="domain"
                placeholder="example.com or user@example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerify();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleVerify} disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </div>

          {initialDomains.length > 0 && (
            <div>
              <Label>Quick Select</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {initialDomains.map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDomain(d);
                      handleVerify();
                    }}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Verification Results</CardTitle>
                <Badge className={getOverallBadgeColor(result.overall)}>
                  {result.overall.toUpperCase()}
                </Badge>
              </div>
              <CardDescription>Domain: {result.domain}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SPF */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.spf.valid, result.spf.exists)}
                    <h3 className="font-semibold">SPF Record</h3>
                  </div>
                  <Badge
                    variant={result.spf.valid ? "default" : "destructive"}
                  >
                    {result.spf.exists
                      ? result.spf.valid
                        ? "Valid"
                        : "Invalid"
                      : "Not Found"}
                  </Badge>
                </div>
                {result.spf.record && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <code className="text-sm break-all">{result.spf.record}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.spf.record!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {result.spf.errors && result.spf.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {result.spf.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* DKIM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.dkim.valid, result.dkim.exists)}
                    <h3 className="font-semibold">DKIM Record</h3>
                  </div>
                  <Badge
                    variant={result.dkim.valid ? "default" : "destructive"}
                  >
                    {result.dkim.exists
                      ? result.dkim.valid
                        ? "Valid"
                        : "Invalid"
                      : "Not Found"}
                  </Badge>
                </div>
                {result.dkim.selector && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Selector: {result.dkim.selector}
                  </p>
                )}
                {result.dkim.record && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <code className="text-sm break-all">{result.dkim.record}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.dkim.record!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {result.dkim.errors && result.dkim.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {result.dkim.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* DMARC */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.dmarc.valid, result.dmarc.exists)}
                    <h3 className="font-semibold">DMARC Record</h3>
                  </div>
                  <Badge
                    variant={result.dmarc.valid ? "default" : "destructive"}
                  >
                    {result.dmarc.exists
                      ? result.dmarc.valid
                        ? "Valid"
                        : "Invalid"
                      : "Not Found"}
                  </Badge>
                </div>
                {result.dmarc.policy && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Policy: {result.dmarc.policy}
                  </p>
                )}
                {result.dmarc.record && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <code className="text-sm break-all">{result.dmarc.record}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.dmarc.record!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {result.dmarc.errors && result.dmarc.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    {result.dmarc.errors.map((error, i) => (
                      <p key={i}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                Add these DNS records to your domain to improve email deliverability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result.spf.exists && (
                <div>
                  <h4 className="font-semibold mb-2">SPF Record</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add a TXT record to your domain:
                  </p>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Type:</strong> TXT
                      </div>
                      <div>
                        <strong>Name:</strong> @ (or root)
                      </div>
                      <div>
                        <strong>Value:</strong>{" "}
                        <code>v=spf1 include:_spf.google.com ~all</code>
                      </div>
                      <div>
                        <strong>TTL:</strong> 3600
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!result.dmarc.exists && (
                <div>
                  <h4 className="font-semibold mb-2">DMARC Record</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add a TXT record to _dmarc subdomain:
                  </p>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Type:</strong> TXT
                      </div>
                      <div>
                        <strong>Name:</strong> _dmarc
                      </div>
                      <div>
                        <strong>Value:</strong>{" "}
                        <code>v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com</code>
                      </div>
                      <div>
                        <strong>TTL:</strong> 3600
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

