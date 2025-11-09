/**
 * Editor Toolbar Component
 * Top navigation with save, undo, redo, preview, export buttons
 */

"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Save,
  Undo,
  Redo,
  Upload,
  FileJson,
  FileCode,
  Loader2,
} from "lucide-react";
import { useEmailBuilder } from "./EmailBuilderContext";
import { PreviewDialog } from "./PreviewDialog";
import { JsonView } from "./JsonView";
import { HtmlView } from "./HtmlView";
import { TestSendDialog } from "@/components/templates/TestSendDialog";
import { CustomVariableManager } from "@/components/templates/CustomVariableManager";
import { TranslationPanel } from "@/components/templates/TranslationPanel";
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";
import { Badge } from "@/components/ui/badge";

interface EditorToolbarProps {
  activeTab: "design" | "json" | "html";
  onTabChange: (tab: "design" | "json" | "html") => void;
}

export function EditorToolbar({ activeTab, onTabChange }: EditorToolbarProps) {
  const { state, undo, redo, canUndo, canRedo, markSaved, setDocument, templateId, defaultLanguage: currentLanguage, loadLanguage, availableLanguages, saveDocument } = useEmailBuilder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (!templateId || newLanguage === currentLanguage) return;

    setIsLoadingLanguage(true);
    try {
      // Save current document before switching if dirty
      if (state.isDirty && templateId) {
        const saveResult = await saveDocument();
        if (!saveResult.success) {
          const errorMsg = saveResult.error || "Unknown error";
          toast.error(`Failed to save before switching: ${errorMsg}`);
          // Ask user if they want to continue anyway
          const shouldContinue = window.confirm(
            "Failed to save current changes. Do you want to switch languages anyway? Your changes may be lost."
          );
          if (!shouldContinue) {
            setIsLoadingLanguage(false);
            return;
          }
        } else {
          toast.success("Saved before switching language");
        }
      }
      
      // Load the language structure
      const loadResult = await loadLanguage(newLanguage);
      
      if (!loadResult.success) {
        const errorMsg = loadResult.error || "Unknown error";
        toast.error(`Failed to switch language: ${errorMsg}`);
        return;
      }
      
      toast.success(`Switched to ${newLanguage.toUpperCase()}`);
    } catch (error) {
      console.error("Language change error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to switch language: ${errorMessage}`);
    } finally {
      setIsLoadingLanguage(false);
    }
  };

  const handleSave = async () => {
    if (!templateId) {
      toast.error("No template ID");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveDocument();
      if (!result.success) {
        const errorMsg = result.error || "Unknown error";
        toast.error(`Failed to save template: ${errorMsg}`);
      } else {
        toast.success("Template saved successfully");
      }
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save template: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    if (canUndo) {
      undo();
      toast.success("Undone");
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
      toast.success("Redone");
    }
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const document = JSON.parse(json) as EmailBuilderDocument;
        
        // Basic validation
        if (!document.childrenIds || !Array.isArray(document.childrenIds)) {
          throw new Error("Invalid document structure");
        }

        // Confirm before replacing
        if (state.isDirty && !confirm("You have unsaved changes. Replace current document?")) {
          return;
        }

        setDocument(document);
        toast.success("JSON imported successfully");
      } catch (error) {
        console.error("Import error:", error);
        toast.error("Failed to import JSON. Please check the file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = "";
  };

  const handleExportHTML = async () => {
    const { renderToStaticMarkup } = await import("@/lib/email-builder/renderer");
    const html = renderToStaticMarkup(state.document);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-template.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML exported");
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(state.document, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-template.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  };

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "design" | "json" | "html")} className="w-auto">
          <TabsList>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        {/* Export */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportJSON}
          title="Download JSON"
        >
          <FileJson className="h-4 w-4 mr-1" />
          Export JSON
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportHTML}
          title="Download HTML"
        >
          <FileCode className="h-4 w-4 mr-1" />
          Export HTML
        </Button>

        {/* Import */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportJSON}
          title="Import JSON"
        >
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>

        {/* Language Selector */}
        {templateId && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Language:</span>
              <LanguageSelector
                value={currentLanguage || "en"}
                onValueChange={handleLanguageChange}
                className="w-[120px]"
                disabled={isLoadingLanguage}
              />
              {isLoadingLanguage && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Switching...</span>
                </div>
              )}
            </div>
            {availableLanguages && availableLanguages.length > 0 && (
              <div className="flex gap-1 items-center">
                <span className="text-xs text-muted-foreground">Available:</span>
                {availableLanguages.map((lang) => (
                  <Badge 
                    key={lang} 
                    variant={lang === currentLanguage ? "default" : "outline"} 
                    className="text-xs cursor-pointer"
                    title={lang === currentLanguage ? "Current language" : `Switch to ${lang.toUpperCase()}`}
                    onClick={() => lang !== currentLanguage && !isLoadingLanguage && handleLanguageChange(lang)}
                  >
                    {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage Custom Variables */}
        <CustomVariableManager />

        {/* Translations - Optional feature, can be hidden if using separate templates */}
        {/* {templateId && <TranslationPanel templateId={templateId} />} */}

        {/* Preview */}
        <PreviewDialog />

        {/* Test Send */}
        {templateId && (
          <TestSendDialog
            templateId={templateId}
            templateName="Template"
          />
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Save */}
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!state.isDirty || isSaving}
          title="Save"
        >
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? "Saving..." : state.isDirty ? "Save" : "Saved"}
        </Button>
      </div>
    </div>
  );
}

