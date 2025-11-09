/**
 * Add Language Dialog Component
 * Dialog for adding a new custom language
 */

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createLanguage } from "@/app/actions/languages";
import { toast } from "sonner";

interface AddLanguageDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddLanguageDialog({ onSuccess, trigger }: AddLanguageDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate ISO 639-1 code (2 letters)
    if (!/^[a-z]{2}$/i.test(formData.code)) {
      toast.error("Language code must be 2 letters (ISO 639-1 format)");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createLanguage({
        code: formData.code.toLowerCase(),
        name: formData.name,
        isActive: false, // New languages are inactive by default
      });

      if (result.success) {
        toast.success("Language created successfully");
        setIsOpen(false);
        setFormData({ code: "", name: "" });
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create language");
      }
    } catch (error) {
      toast.error("Failed to create language");
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Language
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Language</DialogTitle>
          <DialogDescription>
            Add a custom language using ISO 639-1 format (2-letter code)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Language Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.toLowerCase().slice(0, 2),
                })
              }
              placeholder="e.g., ja, ko, zh"
              maxLength={2}
              pattern="[a-z]{2}"
              required
            />
            <p className="text-xs text-gray-500">
              ISO 639-1 two-letter code (e.g., en, es, fr)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Language Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Japanese/日本語"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Language"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

