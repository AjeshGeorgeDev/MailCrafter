/**
 * Organization Settings Client Component
 * Handles organization settings form
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateOrganization, deleteOrganization } from "@/app/actions/organizations";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

interface OrganizationSettingsClientProps {
  organization: Organization;
  languages: Language[];
}

export function OrganizationSettingsClient({
  organization,
  languages,
}: OrganizationSettingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    defaultLanguage: organization.defaultLanguage,
  });

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateOrganization({
        name: formData.name,
        defaultLanguage: formData.defaultLanguage,
      });

      if (result.success) {
        toast.success("Organization updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update organization");
      }
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteOrganization();

      if (result.success) {
        toast.success("Organization deleted successfully");
        router.push("/");
      } else {
        toast.error(result.error || "Failed to delete organization");
        setIsDeleting(false);
      }
    });
  };

  const activeLanguages = languages.filter((lang) => lang.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization details and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Update your organization name and default language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Organization"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <Select
              value={formData.defaultLanguage}
              onValueChange={(value) =>
                setFormData({ ...formData, defaultLanguage: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                {activeLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Organization</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  organization and all associated data including templates, campaigns,
                  email logs, and team members.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete Organization"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

