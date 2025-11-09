"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useTransition } from "react";
import { createApiKey, getApiKeys, revokeApiKey, updateApiKey } from "@/app/actions/api-keys";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, Check, Calendar, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  isExpired: boolean;
}

export function ApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [newKeyExpiresAt, setNewKeyExpiresAt] = useState<string>("");
  const [createdKey, setCreatedKey] = useState<{ id: string; name: string; key: string } | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const availablePermissions = [
    { value: "emails.send", label: "Send Emails" },
    { value: "templates.read", label: "Read Templates" },
    { value: "templates.write", label: "Write Templates" },
    { value: "campaigns.read", label: "Read Campaigns" },
    { value: "campaigns.write", label: "Write Campaigns" },
    { value: "analytics.read", label: "Read Analytics" },
  ];

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    setIsLoading(true);
    try {
      const result = await getApiKeys();
      if (result.success) {
        setApiKeys(result.apiKeys || []);
      } else {
        toast.error(result.error || "Failed to load API keys");
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    startTransition(async () => {
      const result = await createApiKey({
        name: newKeyName,
        permissions: newKeyPermissions,
        expiresAt: newKeyExpiresAt || null,
      });

      if (result.success && result.apiKey) {
        setCreatedKey({
          id: result.apiKey.id,
          name: result.apiKey.name,
          key: result.apiKey.key,
        });
        setNewKeyDialogOpen(false);
        setNewKeyName("");
        setNewKeyPermissions([]);
        setNewKeyExpiresAt("");
        await loadApiKeys();
        toast.success("API key created successfully");
      } else {
        toast.error(result.error || "Failed to create API key");
      }
    });
  };

  const handleRevokeKey = async () => {
    if (!revokeKeyId) return;

    startTransition(async () => {
      const result = await revokeApiKey(revokeKeyId);
      if (result.success) {
        setRevokeKeyId(null);
        await loadApiKeys();
        toast.success("API key revoked successfully");
      } else {
        toast.error(result.error || "Failed to revoke API key");
      }
    });
  };

  const handleCopyKey = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(keyId);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy");
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your MailCrafter account
              </CardDescription>
            </div>
            <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for programmatic access. You'll only be able to see the key once.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., Production API Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Give this key a descriptive name to identify its purpose
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {availablePermissions.map((perm) => (
                        <div key={perm.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={perm.value}
                            checked={newKeyPermissions.includes(perm.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewKeyPermissions([...newKeyPermissions, perm.value]);
                              } else {
                                setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm.value));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={perm.value} className="font-normal cursor-pointer">
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires-at">Expires At (Optional)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={newKeyExpiresAt}
                      onChange={(e) => setNewKeyExpiresAt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for keys that never expire
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewKeyDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateKey} disabled={isPending}>
                    {isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium mb-2">No API keys</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first API key to enable programmatic access
              </p>
              <Button onClick={() => setNewKeyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{key.name}</h3>
                      {key.isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {!key.isExpired && key.expiresAt && (
                        <Badge variant="outline">Expires {formatDate(key.expiresAt)}</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Created:</span> {formatDateTime(key.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium">Last used:</span> {formatDateTime(key.lastUsedAt)}
                      </p>
                      {key.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRevokeKeyId(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Key Display Dialog */}
      <Dialog open={!!createdKey} onOpenChange={(open) => !open && setCreatedKey(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your API key has been created. Make sure to copy it now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input value={createdKey?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdKey?.key || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => createdKey && handleCopyKey(createdKey.key, createdKey.id)}
                >
                  {copiedKeyId === createdKey?.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this key in the Authorization header: <code className="bg-muted px-1 rounded">Authorization: Bearer {createdKey?.key}</code>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>I've Saved the Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeKeyId} onOpenChange={(open) => !open && setRevokeKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The API key will be immediately revoked and any applications using it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Revoking..." : "Revoke Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

