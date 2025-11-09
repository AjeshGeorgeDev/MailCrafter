/**
 * Audit Log Client Component
 * Displays audit logs with filtering
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AuditLogClientProps {
  initialLogs: AuditLog[];
  total: number;
  currentPage: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  VIEW: "bg-gray-100 text-gray-800",
  SEND: "bg-purple-100 text-purple-800",
  INVITE: "bg-yellow-100 text-yellow-800",
  REMOVE: "bg-orange-100 text-orange-800",
};

export function AuditLogClient({
  initialLogs,
  total,
  currentPage,
}: AuditLogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actionFilter, setActionFilter] = useState(
    searchParams.get("action") || "all"
  );
  const [resourceFilter, setResourceFilter] = useState(
    searchParams.get("resource") || "all"
  );

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    params.set("page", "1");
    router.push(`/dashboard/settings/audit-log?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">
          Track all actions performed in your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {total} total action{total !== 1 ? "s" : ""} logged
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value);
                  handleFilterChange("action", value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="SEND">Send</SelectItem>
                  <SelectItem value="INVITE">Invite</SelectItem>
                  <SelectItem value="REMOVE">Remove</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={resourceFilter}
                onValueChange={(value) => {
                  setResourceFilter(value);
                  handleFilterChange("resource", value);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="TEMPLATE">Template</SelectItem>
                  <SelectItem value="CAMPAIGN">Campaign</SelectItem>
                  <SelectItem value="SMTP_PROFILE">SMTP Profile</SelectItem>
                  <SelectItem value="ORGANIZATION">Organization</SelectItem>
                  <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {initialLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.user.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.resourceType || "N/A"}
                      {log.resourceId && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({log.resourceId.substring(0, 8)}...)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.changes && typeof log.changes === "object" ? (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-2 rounded">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

