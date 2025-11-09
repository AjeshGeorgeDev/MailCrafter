/**
 * Custom Variable Manager Component
 * Manage custom variables for the organization
 */

"use client";

import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { 
  createCustomVariable, 
  updateCustomVariable, 
  deleteCustomVariable,
  getCustomVariables,
} from "@/app/actions/custom-variables";
import { toast } from "sonner";

interface CustomVariable {
  id: string;
  name: string;
  path: string;
  description: string | null;
  type: string;
  sampleValue: any;
  category: string;
}

export function CustomVariableManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [variables, setVariables] = useState<CustomVariable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVariable, setEditingVariable] = useState<CustomVariable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    description: "",
    type: "string" as "string" | "number" | "boolean" | "object" | "array",
    sampleValue: "",
    category: "Custom",
  });

  useEffect(() => {
    if (isOpen) {
      loadVariables();
    }
  }, [isOpen]);

  const loadVariables = async () => {
    setIsLoading(true);
    try {
      const result = await getCustomVariables();
      if (result.success && result.variables) {
        setVariables(result.variables);
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to load variables");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingVariable(null);
    setFormData({
      name: "",
      path: "",
      description: "",
      type: "string",
      sampleValue: "",
      category: "Custom",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (variable: CustomVariable) => {
    setEditingVariable(variable);
    setFormData({
      name: variable.name,
      path: variable.path.replace("custom.", ""),
      description: variable.description || "",
      type: variable.type as any,
      sampleValue: variable.sampleValue 
        ? (typeof variable.sampleValue === "string" 
            ? variable.sampleValue 
            : JSON.stringify(variable.sampleValue, null, 2))
        : "",
      category: variable.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this variable?")) {
      return;
    }

    try {
      const result = await deleteCustomVariable(id);
      if (result.success) {
        toast.success("Variable deleted");
        loadVariables();
      } else {
        toast.error(result.error || "Failed to delete variable");
      }
    } catch (error) {
      toast.error("Failed to delete variable");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let sampleValue: any = formData.sampleValue;
      
      // Parse sample value based on type
      if (formData.sampleValue.trim()) {
        if (formData.type === "object" || formData.type === "array") {
          try {
            sampleValue = JSON.parse(formData.sampleValue);
          } catch {
            toast.error("Invalid JSON for sample value");
            return;
          }
        } else if (formData.type === "number") {
          sampleValue = parseFloat(formData.sampleValue);
          if (isNaN(sampleValue)) {
            toast.error("Invalid number");
            return;
          }
        } else if (formData.type === "boolean") {
          sampleValue = formData.sampleValue.toLowerCase() === "true";
        } else {
          sampleValue = formData.sampleValue;
        }
      }

      const data = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined,
        type: formData.type,
        sampleValue: sampleValue || undefined,
        category: formData.category,
      };

      let result;
      if (editingVariable) {
        result = await updateCustomVariable(editingVariable.id, data);
      } else {
        result = await createCustomVariable(data);
      }

      if (result.success) {
        toast.success(editingVariable ? "Variable updated" : "Variable created");
        setIsDialogOpen(false);
        loadVariables();
      } else {
        toast.error(result.error || "Failed to save variable");
      }
    } catch (error) {
      toast.error("Failed to save variable");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Manage Custom Variables"
      >
        <Settings className="h-4 w-4 mr-2" />
        Manage Variables
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Variables</DialogTitle>
            <DialogDescription>
              Create and manage custom variables for your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Variable
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : variables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No custom variables yet. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variables.map((variable) => (
                    <TableRow key={variable.id}>
                      <TableCell className="font-medium">{variable.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {variable.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {variable.type}
                        </span>
                      </TableCell>
                      <TableCell>{variable.category}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {variable.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(variable)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(variable.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? "Edit Variable" : "Create Variable"}
            </DialogTitle>
            <DialogDescription>
              Define a custom variable that can be used in your email templates
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Discount Code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">custom.</span>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                  placeholder="discountCode"
                  required
                  pattern="[a-zA-Z][a-zA-Z0-9_]*"
                />
              </div>
              <p className="text-xs text-gray-500">
                Variable will be accessible as: <code>custom.{formData.path || "..."}</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Custom"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of this variable"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleValue">
                Sample Value
                {formData.type === "object" || formData.type === "array" ? " (JSON)" : ""}
              </Label>
              {formData.type === "object" || formData.type === "array" ? (
                <Textarea
                  id="sampleValue"
                  value={formData.sampleValue}
                  onChange={(e) => setFormData({ ...formData, sampleValue: e.target.value })}
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm"
                  rows={4}
                />
              ) : (
                <Input
                  id="sampleValue"
                  type={formData.type === "number" ? "number" : "text"}
                  value={formData.sampleValue}
                  onChange={(e) => setFormData({ ...formData, sampleValue: e.target.value })}
                  placeholder={
                    formData.type === "boolean" ? "true or false" : "Sample value"
                  }
                />
              )}
              <p className="text-xs text-gray-500">
                This value will be used in previews and test emails
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingVariable ? "Update" : "Create"} Variable
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

