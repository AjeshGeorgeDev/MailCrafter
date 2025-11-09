/**
 * New Email Builder Wrapper
 * Integrates with template saving/loading
 */

"use client";

import React, { useState, useEffect } from "react";
import { EmailBuilder } from "../email-builder/EmailBuilder";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";
import { fromOldFormat } from "@/lib/email-builder/adapter";
import { saveTemplate } from "@/app/actions/templates";
import { toast } from "sonner";

// Re-export for convenience
export { useImageUpload } from "../email-builder/hooks/useImageUpload";
export { useEmailActions } from "../email-builder/hooks/useEmailActions";

interface NewEmailBuilderProps {
  templateId?: string;
  initialStructure?: any; // Can be old or new format
  templateName?: string;
  defaultLanguage?: string;
  allStructures?: Record<string, any>; // All language structures
  onSave?: (document: EmailBuilderDocument) => void | Promise<void>;
}

export function NewEmailBuilder({
  templateId,
  initialStructure,
  templateName,
  defaultLanguage,
  allStructures,
  onSave,
}: NewEmailBuilderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [convertedStructure, setConvertedStructure] = useState<EmailBuilderDocument | undefined>(undefined);

  // Ensure we only render on client to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Convert initial structure to new format if needed (only on client)
  useEffect(() => {
    if (!initialStructure) {
      setConvertedStructure(undefined);
      return;
    }
    
    try {
      // Check if already in EmailBuilderDocument format
      if (initialStructure && typeof initialStructure === 'object' && 'childrenIds' in initialStructure) {
        setConvertedStructure(initialStructure as EmailBuilderDocument);
      } else {
        const converted = fromOldFormat(initialStructure);
        setConvertedStructure(converted);
      }
    } catch (error) {
      console.error("Error converting structure:", error);
      // If conversion fails, try to use structure directly
      if (initialStructure && typeof initialStructure === 'object' && 'childrenIds' in initialStructure) {
        setConvertedStructure(initialStructure as EmailBuilderDocument);
      } else {
        setConvertedStructure(undefined);
      }
    }
  }, [initialStructure]);

  const handleSave = async (document: EmailBuilderDocument, language?: string) => {
    try {
      if (templateId) {
        // Save to database with language
        const langToUse = language || defaultLanguage || "en";
        const result = await saveTemplate(templateId, document, langToUse);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Template saved");
      }
      
      // Also call optional onSave callback
      if (onSave) {
        await onSave(document);
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save template");
    }
  };

  // Prevent hydration mismatch by only rendering on client
  if (!isMounted) {
    return (
      <div className="h-[calc(100vh-120px)] border rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] border rounded-lg overflow-hidden">
      <EmailBuilder
        templateId={templateId}
        initialDocument={convertedStructure}
        onSave={handleSave}
        height="100%"
        defaultLanguage={defaultLanguage}
        allStructures={allStructures}
      />
    </div>
  );
}

