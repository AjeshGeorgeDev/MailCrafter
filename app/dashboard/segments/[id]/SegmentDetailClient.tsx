/**
 * Segment Detail Client Component
 * Display segment details and matching contacts
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users, RefreshCw, Mail } from "lucide-react";
import { SegmentFormDialog } from "../SegmentFormDialog";
import { refreshSegmentCountAction } from "@/app/actions/segments";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Segment {
  id: string;
  name: string;
  conditions: any;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  subscribedAt: Date;
}

interface SegmentDetailClientProps {
  segment: Segment;
  initialContacts: Contact[];
  totalContacts: number;
}

export function SegmentDetailClient({
  segment,
  initialContacts,
  totalContacts,
}: SegmentDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contactCount, setContactCount] = useState(totalContacts);

  const handleRefreshCount = () => {
    startTransition(async () => {
      const result = await refreshSegmentCountAction(segment.id);
      if (result.success) {
        toast.success("Segment count refreshed");
        setContactCount(result.contactCount || 0);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to refresh segment count");
      }
    });
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsDialogOpen(false);
    if (updated) {
      router.refresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBSCRIBED":
        return "bg-green-100 text-green-800";
      case "UNSUBSCRIBED":
        return "bg-gray-100 text-gray-800";
      case "BOUNCED":
        return "bg-red-100 text-red-800";
      case "COMPLAINED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/segments")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{segment.name}</h1>
            <p className="text-muted-foreground">
              Created {format(new Date(segment.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshCount}
            disabled={isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Count
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Segment
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contactCount}</div>
            <p className="text-sm text-muted-foreground mt-1">matching contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {format(new Date(segment.updatedAt), "MMM d, yyyy")}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(segment.updatedAt), "h:mm a")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {segment.conditions?.rules?.length || segment.conditions?.conditions?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-1">rule groups</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matching Contacts</CardTitle>
          <CardDescription>
            Preview of contacts that match this segment ({initialContacts.length} shown)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialContacts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No contacts match this segment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.email}</TableCell>
                    <TableCell>
                      {contact.firstName || contact.lastName
                        ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contact.subscribedAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SegmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        segment={segment}
        onSuccess={handleDialogClose}
      />
    </div>
  );
}

