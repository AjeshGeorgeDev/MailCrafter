"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Edit, Trash2, Copy, Eye, MoreVertical, Plus, Languages } from "lucide-react";
import Link from "next/link";
import { deleteTemplate, duplicateTemplate } from "@/app/actions/templates";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description: string | null;
  defaultLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    name: string | null;
  } | null;
}

interface TemplatesPageClientProps {
  initialTemplates: Template[];
  total: number;
}

export function TemplatesPageClient({ initialTemplates, total }: TemplatesPageClientProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<Template | null>(null);
  const [duplicateLanguage, setDuplicateLanguage] = useState<string>("en");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;

    startTransition(async () => {
      const result = await deleteTemplate(templateToDelete);
      if (result.success) {
        toast.success("Template deleted successfully");
        setTemplates(templates.filter((t) => t.id !== templateToDelete));
        setDeleteDialogOpen(false);
        setTemplateToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    });
  };

  const handleDuplicate = (template: Template) => {
    setTemplateToDuplicate(template);
    setDuplicateLanguage(template.defaultLanguage);
    setDuplicateDialogOpen(true);
  };

  const confirmDuplicate = () => {
    if (!templateToDuplicate) return;

    startTransition(async () => {
      const result = await duplicateTemplate(
        templateToDuplicate.id,
        duplicateLanguage !== templateToDuplicate.defaultLanguage ? duplicateLanguage : undefined
      );
      if (result.success && result.template) {
        toast.success(
          `Template duplicated${duplicateLanguage !== templateToDuplicate.defaultLanguage ? ` in ${duplicateLanguage.toUpperCase()}` : ""} successfully`
        );
        setDuplicateDialogOpen(false);
        setTemplateToDuplicate(null);
        router.refresh();
        router.push(`/dashboard/templates/${result.template.id}/edit`);
      } else {
        toast.error(result.error || "Failed to duplicate template");
      }
    });
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            {total} template{total !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No templates match your search" : "No templates yet"}
              </p>
              <Link href="/dashboard/templates/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(() => {
                          // Parse structure to get available languages
                          const structure = (template as any).structure;
                          let languages: string[] = [];
                          
                          if (structure && typeof structure === 'object' && !Array.isArray(structure) && !structure.childrenIds) {
                            // Language-specific format
                            languages = Object.keys(structure);
                          } else {
                            // Old format - show default language
                            languages = [template.defaultLanguage || "en"];
                          }
                          
                          return languages.map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang.toUpperCase()}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>{template.description || "-"}</TableCell>
                    <TableCell>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {template.creator?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/templates/${template.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Template Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>
              {templateToDuplicate && (
                <>
                  Duplicate "{templateToDuplicate.name}" to create a copy.
                  {duplicateLanguage !== templateToDuplicate.defaultLanguage && (
                    <span className="block mt-2 text-sm font-medium">
                      This will create a new template in {duplicateLanguage.toUpperCase()}.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {templateToDuplicate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Template Language</Label>
                <LanguageSelector
                  value={duplicateLanguage}
                  onValueChange={setDuplicateLanguage}
                  placeholder="Select language"
                />
                <p className="text-xs text-gray-500">
                  Select a different language to create a language-specific version, or keep the same language for an exact copy.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setTemplateToDuplicate(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmDuplicate} disabled={isPending}>
              {isPending ? "Duplicating..." : "Duplicate Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

