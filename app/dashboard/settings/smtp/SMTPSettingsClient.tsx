/**
 * SMTP Settings Client Component
 * Handles client-side interactions for SMTP profile management
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SMTPProfileCard } from "@/components/smtp/SMTPProfileCard";
import { SMTPForm } from "@/components/smtp/SMTPForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { deleteSMTPProfile, setDefaultSMTPProfile, getSMTPProfiles } from "@/app/actions/smtp";
import { SMTPTestDialog } from "@/components/smtp/SMTPTestDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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

interface SMTPSettingsClientProps {
  initialProfiles: SMTPProfile[];
}

export function SMTPSettingsClient({ initialProfiles }: SMTPSettingsClientProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<SMTPProfile[]>(initialProfiles);
  const [isPending, startTransition] = useTransition();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SMTPProfile | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleCreate = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (profile) {
      setEditingProfile(profile);
      setIsFormOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingProfileId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingProfileId) return;

    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteSMTPProfile(deletingProfileId);
      
      if (result.success) {
        toast.success("SMTP profile deleted successfully");
        setProfiles(profiles.filter((p) => p.id !== deletingProfileId));
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete SMTP profile");
      }
      
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingProfileId(null);
    });
  };

  const handleSetDefault = (id: string) => {
    startTransition(async () => {
      const result = await setDefaultSMTPProfile(id);
      
      if (result.success) {
        toast.success("Default SMTP profile updated");
        // Update local state
        setProfiles(
          profiles.map((p) => ({
            ...p,
            isDefault: p.id === id,
          }))
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to set default profile");
      }
    });
  };

  const handleTest = (id: string) => {
    setTestingProfileId(id);
    setIsTestDialogOpen(true);
    // TODO: Implement test connection
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
    // Refresh profiles
    startTransition(async () => {
      const result = await getSMTPProfiles();
      if (result.profiles) {
        setProfiles(result.profiles);
      }
      router.refresh();
    });
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">SMTP Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your SMTP profiles for sending emails
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add SMTP Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No SMTP profiles configured</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Profile
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <SMTPProfileCard
              key={profile.id}
              profile={profile}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTest={handleTest}
              onSetDefault={handleSetDefault}
              isDeleting={isDeleting && deletingProfileId === profile.id}
              isTesting={isTesting && testingProfileId === profile.id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? "Edit SMTP Profile" : "Create SMTP Profile"}
            </DialogTitle>
            <DialogDescription>
              {editingProfile
                ? "Update your SMTP profile settings"
                : "Configure a new SMTP profile for sending emails"}
            </DialogDescription>
          </DialogHeader>
          <SMTPForm
            profileId={editingProfile?.id}
            initialData={editingProfile ? {
              name: editingProfile.name,
              host: editingProfile.host,
              port: editingProfile.port,
              username: editingProfile.username,
              encryption: editingProfile.encryption,
              fromEmail: editingProfile.fromEmail,
              fromName: editingProfile.fromName || undefined,
              replyTo: editingProfile.replyTo || undefined,
              isDefault: editingProfile.isDefault,
              maxHourlyRate: editingProfile.maxHourlyRate || undefined,
            } : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SMTP profile.
              Make sure it's not being used in any active campaigns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Connection Dialog */}
      {testingProfileId && (
        <SMTPTestDialog
          profileId={testingProfileId}
          profileName={profiles.find((p) => p.id === testingProfileId)?.name || "Unknown"}
          open={isTestDialogOpen}
          onOpenChange={(open) => {
            setIsTestDialogOpen(open);
            if (!open) {
              setTestingProfileId(null);
            }
          }}
        />
      )}
    </div>
  );
}

