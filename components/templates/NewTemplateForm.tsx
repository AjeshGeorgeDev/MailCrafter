"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createTemplate } from "@/app/actions/templates";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { getDefaultLanguage } from "@/app/actions/languages";
import { TemplatePicker } from "./TemplatePicker";
import {
  getTemplateWithUniqueIds,
  type PredefinedTemplate,
} from "@/lib/templates/predefined-templates";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";
import { toast } from "sonner";

const newTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  defaultLanguage: z.string().min(1).default("en"),
});

type NewTemplateFormValues = z.infer<typeof newTemplateSchema>;

export function NewTemplateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedPredefinedTemplate, setSelectedPredefinedTemplate] =
    useState<PredefinedTemplate | null>(null);

  useEffect(() => {
    loadDefaultLanguage();
  }, []);

  const loadDefaultLanguage = async () => {
    try {
      const result = await getDefaultLanguage();
      if (result.success) {
        setSelectedLanguage(result.defaultLanguage);
      }
    } catch (error) {
      console.error("Failed to load default language:", error);
    }
  };

  const form = useForm<NewTemplateFormValues>({
    resolver: zodResolver(newTemplateSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      category: "",
      defaultLanguage: "en",
    },
  });

  const handleTemplateSelect = (template: PredefinedTemplate) => {
    setSelectedPredefinedTemplate(template);
    setShowTemplatePicker(false);
    // Pre-fill form with template name
    form.setValue("name", template.name);
    form.setValue("description", template.description);
    form.setValue("category", template.category);
  };

  const onSubmit = (data: NewTemplateFormValues) => {
    startTransition(async () => {
      // Use predefined template structure if selected, otherwise empty
      // Generate unique block IDs for the template (except for blank template)
      let structure: EmailBuilderDocument | undefined;
      if (selectedPredefinedTemplate) {
        if (selectedPredefinedTemplate.id === "blank") {
          // Blank template - use as is
          structure = selectedPredefinedTemplate.structure;
        } else {
          // Predefined template - generate unique IDs (TemplatePicker now passes original template)
          const templateWithIds = getTemplateWithUniqueIds(selectedPredefinedTemplate.id);
          if (!templateWithIds) {
            toast.error(`Template "${selectedPredefinedTemplate.name}" not found`);
            return;
          }
          structure = templateWithIds.structure;
          if (!structure || !structure.childrenIds || structure.childrenIds.length === 0) {
            console.error("Template structure is empty:", selectedPredefinedTemplate.id, structure);
            toast.error("Template structure is invalid");
            return;
          }
        }
      }

      console.log("Creating template with structure:", {
        hasStructure: !!structure,
        childrenCount: structure?.childrenIds?.length || 0,
        language: selectedLanguage,
      });

      const result = await createTemplate({
        name: data.name,
        description: data.description || undefined,
        defaultLanguage: selectedLanguage,
        structure: structure,
      });

      if (result.success && result.template) {
        toast.success("Template created successfully");
        router.push(`/dashboard/templates/${result.template.id}/edit`);
      } else {
        toast.error(result.error || "Failed to create template");
      }
    });
  };

  if (showTemplatePicker) {
    return (
      <Card>
        <CardContent className="pt-6">
          <TemplatePicker
            onSelectTemplate={handleTemplateSelect}
            onCancel={() => setShowTemplatePicker(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Information</CardTitle>
        <CardDescription>
          Enter basic information about your template
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedPredefinedTemplate && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              Selected: {selectedPredefinedTemplate.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedPredefinedTemplate.description}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedPredefinedTemplate(null);
                setShowTemplatePicker(true);
              }}
            >
              Change Template
            </Button>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!selectedPredefinedTemplate && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowTemplatePicker(true)}
                >
                  Choose from Templates
                </Button>
              </div>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome Email" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A brief description of what this template is used for"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language *</FormLabel>
                  <FormControl>
                    <LanguageSelector
                      value={selectedLanguage}
                      onValueChange={(value) => {
                        setSelectedLanguage(value);
                        field.onChange(value);
                      }}
                      placeholder="Select language"
                    />
                  </FormControl>
                  <FormDescription>
                    The default language for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="Newsletter, Transactional, Marketing" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional category to help organize your templates
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Template"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

