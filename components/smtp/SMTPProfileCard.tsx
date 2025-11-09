/**
 * SMTP Profile Card Component
 * Displays SMTP profile information with actions
 */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Server,
  Lock,
  Star,
  Edit,
  Trash2,
  TestTube,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface SMTPProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryption: "TLS" | "SSL" | "NONE";
  fromEmail: string;
  fromName: string | null;
  replyTo: string | null;
  isActive: boolean;
  isDefault: boolean;
  maxHourlyRate: number | null;
  testedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SMTPProfileCardProps {
  profile: SMTPProfile;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting?: boolean;
  isTesting?: boolean;
}

export function SMTPProfileCard({
  profile,
  onEdit,
  onDelete,
  onTest,
  onSetDefault,
  isDeleting = false,
  isTesting = false,
}: SMTPProfileCardProps) {
  const encryptionColors: Record<string, string> = {
    TLS: "bg-green-100 text-green-800",
    SSL: "bg-blue-100 text-blue-800",
    NONE: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className={!profile.isActive ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{profile.name}</CardTitle>
              {profile.isDefault && (
                <Badge variant="default" className="bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
              {!profile.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Server className="h-4 w-4" />
                {profile.host}:{profile.port}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {profile.fromEmail}
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <Badge variant="outline" className={encryptionColors[profile.encryption]}>
                  {profile.encryption}
                </Badge>
              </span>
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(profile.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {!profile.isDefault && (
                <DropdownMenuItem onClick={() => onSetDefault(profile.id)}>
                  <Star className="h-4 w-4 mr-2" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onTest(profile.id)} disabled={isTesting}>
                <TestTube className="h-4 w-4 mr-2" />
                Test Connection
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(profile.id)}
                disabled={isDeleting || profile.isDefault}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Username:</span>
            <span className="font-mono text-xs">{profile.username}</span>
          </div>
          {profile.fromName && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From Name:</span>
              <span>{profile.fromName}</span>
            </div>
          )}
          {profile.replyTo && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reply To:</span>
              <span>{profile.replyTo}</span>
            </div>
          )}
          {profile.maxHourlyRate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Max Hourly Rate:</span>
              <span>{profile.maxHourlyRate.toLocaleString()} emails/hour</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-2">
              {profile.testedAt ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Tested {format(new Date(profile.testedAt), "MMM d, yyyy")}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-muted-foreground">Not tested</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

