/**
 * Team Management Client Component
 * Handles team member management
 */

"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { MoreVertical, UserPlus, Trash2, Shield } from "lucide-react";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/app/actions/team";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  role: Role;
  joinedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamManagementClientProps {
  initialMembers: TeamMember[];
}

const ROLE_COLORS: Record<Role, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  VIEWER: "bg-gray-100 text-gray-800",
};

export function TeamManagementClient({
  initialMembers,
}: TeamManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", role: "VIEWER" as Role });
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleInvite = () => {
    if (!inviteData.email) {
      toast.error("Please enter an email address");
      return;
    }

    startTransition(async () => {
      const result = await inviteTeamMember({
        email: inviteData.email,
        role: inviteData.role,
      });

      if (result.success && result.member) {
        toast.success("Team member invited successfully");
        setMembers([...members, result.member]);
        setShowInviteDialog(false);
        setInviteData({ email: "", role: "VIEWER" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to invite team member");
      }
    });
  };

  const handleUpdateRole = (memberId: string, newRole: Role) => {
    startTransition(async () => {
      const result = await updateTeamMemberRole(memberId, newRole);

      if (result.success && result.member) {
        toast.success("Role updated successfully");
        setMembers(
          members.map((m) => (m.id === memberId ? result.member! : m))
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update role");
      }
    });
  };

  const handleRemove = () => {
    if (!memberToRemove) return;

    startTransition(async () => {
      const result = await removeTeamMember(memberToRemove);

      if (result.success) {
        toast.success("Team member removed successfully");
        setMembers(members.filter((m) => m.id !== memberToRemove));
        setMemberToRemove(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove team member");
        setMemberToRemove(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and their permissions
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No team members yet</p>
              <Button onClick={() => setShowInviteDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.user.image ? (
                            <img
                              src={member.user.image}
                              alt={member.user.name || member.user.email}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {(member.user.name || member.user.email)[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[member.role]}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(member.joinedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const newRole =
                                member.role === "VIEWER"
                                  ? "EDITOR"
                                  : member.role === "EDITOR"
                                  ? "ADMIN"
                                  : "VIEWER";
                              handleUpdateRole(member.id, newRole);
                            }}
                            disabled={member.role === "OWNER"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMemberToRemove(member.id)}
                            disabled={member.role === "OWNER"}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <CardContent className="w-full max-w-md p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Invite Team Member</h2>
                <p className="text-sm text-muted-foreground">
                  Invite a user to join your organization
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteData.email}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteData.role}
                  onValueChange={(value) =>
                    setInviteData({ ...inviteData, role: value as Role })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowInviteDialog(false);
                    setInviteData({ email: "", role: "VIEWER" });
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleInvite} disabled={isPending}>
                  {isPending ? "Inviting..." : "Invite"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose
              access to the organization immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

