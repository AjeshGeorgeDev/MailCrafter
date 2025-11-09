/**
 * Template Picker Component
 * Allows users to select a predefined template
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  predefinedTemplates,
  getTemplatesByCategory,
  getTemplateCategories,
  getTemplateWithUniqueIds,
  type PredefinedTemplate,
} from "@/lib/templates/predefined-templates";
import { Mail, FileText, ShoppingCart, Megaphone, Eye } from "lucide-react";
import { renderToStaticMarkup } from "@/lib/email-builder/renderer";

interface TemplatePickerProps {
  onSelectTemplate: (template: PredefinedTemplate) => void;
  onCancel: () => void;
}

const categoryIcons: Record<string, any> = {
  Marketing: Megaphone,
  Transactional: ShoppingCart,
  Newsletter: FileText,
  Default: Mail,
};

export function TemplatePicker({ onSelectTemplate, onCancel }: TemplatePickerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PredefinedTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const categories = getTemplateCategories();

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category] || categoryIcons.Default;
    return <Icon className="h-4 w-4" />;
  };

  const handlePreview = async (template: PredefinedTemplate) => {
    setPreviewTemplate(template);
    setIsLoadingPreview(true);
    try {
      // Generate unique IDs for preview
      const templateWithIds = getTemplateWithUniqueIds(template.id);
      if (templateWithIds) {
        const html = renderToStaticMarkup(templateWithIds.structure);
        setPreviewHtml(html);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewHtml("<p>Error loading preview</p>");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
    setPreviewHtml("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Choose a Template</h2>
        <p className="text-muted-foreground">
          Start with a pre-designed template or create from scratch
        </p>
      </div>

      <Tabs defaultValue={categories[0] || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {getCategoryIcon(category)}
              <span className="ml-2">{category}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predefinedTemplates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded-lg flex items-center justify-center relative group">
                    <Mail className="h-12 w-12 text-muted-foreground" />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getTemplatesByCategory(category).map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-muted rounded-lg flex items-center justify-center relative group">
                      <Mail className="h-12 w-12 text-muted-foreground" />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(template);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(template);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Pass null to indicate starting from scratch
              onSelectTemplate({
                id: "blank",
                name: "Blank Template",
                description: "Start with an empty template",
                category: "Custom",
                structure: {
                  backdropColor: "#F8F8F8",
                  canvasColor: "#FFFFFF",
                  textColor: "#242424",
                  fontFamily: "MODERN_SANS",
                  childrenIds: [],
                },
              });
            }}
          >
            Start from Scratch
          </Button>
          <Button
            onClick={() => {
              if (selectedTemplate) {
                // Pass the original template (not processed) - processing will happen in NewTemplateForm
                const template = predefinedTemplates.find((t) => t.id === selectedTemplate);
                if (template) {
                  onSelectTemplate(template);
                }
              }
            }}
            disabled={!selectedTemplate}
          >
            Use Template
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg" style={{ backgroundColor: previewTemplate?.structure?.backdropColor || "#F8F8F8" }}>
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading preview...</div>
              </div>
            ) : (
              <div
                className="p-4"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClosePreview}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  // Pass the original template (not processed) - processing will happen in NewTemplateForm
                  // previewTemplate is already the original template from predefinedTemplates
                  onSelectTemplate(previewTemplate);
                }
              }}
            >
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

