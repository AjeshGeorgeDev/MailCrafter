"use client";

/**
 * Template Editor Client
 */

import { TipTapEmailBuilder } from "@/components/templates/TipTapEmailBuilder";
import { saveTemplateAction } from "@/app/actions/templates-client";
import { EmailDocument } from "@/lib/email/types";
import { normalizeTemplateStructure } from "@/lib/email/normalize";
import { useState } from "react";
import { toast } from "sonner";

interface TemplateEditorClientProps {
  templateId: string;
  initialStructure: any;
  templateName: string;
}

export function TemplateEditorClient({
  templateId,
  initialStructure,
  templateName,
}: TemplateEditorClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<EmailDocument>(
    normalizeTemplateStructure(initialStructure)
  );
  const normalizedStructure = normalizeTemplateStructure(initialStructure);

  const handleSave = async (structure: EmailDocument) => {
    if (!templateId) {
      console.error("Template ID is missing");
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveTemplateAction(templateId, structure);
      if (result?.error) {
        console.error("Save failed:", result.error);
        toast.error(result.error);
      } else {
        toast.success("Template saved successfully");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

              return (
                <div className="h-[calc(100vh-200px)]">
                  <TipTapEmailBuilder
                    initialStructure={normalizedStructure}
                    onSave={handleSave}
                    autoSaveInterval={30000}
                    onDocumentChange={(document) => {
                      setCurrentDocument(document);
                    }}
                  />
                </div>
              );
}

