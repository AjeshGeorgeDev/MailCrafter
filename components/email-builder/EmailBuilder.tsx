/**
 * Email Builder - Main Component
 * Brings together all editor components
 */

"use client";

import React from "react";
import { EmailBuilderProvider } from "./EmailBuilderContext";
import { EmailBuilderInner } from "./EmailBuilderInner";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";

interface EmailBuilderProps {
  initialDocument?: EmailBuilderDocument;
  onDocumentChange?: (document: EmailBuilderDocument) => void;
  onSave?: (document: EmailBuilderDocument, language?: string) => void | Promise<void>;
  height?: string | number;
  templateId?: string;
  defaultLanguage?: string;
  allStructures?: Record<string, any>;
}

export function EmailBuilder({
  initialDocument,
  onDocumentChange,
  onSave,
  height = "100vh",
  templateId,
  defaultLanguage,
  allStructures,
}: EmailBuilderProps) {
  return (
    <EmailBuilderProvider
      initialDocument={initialDocument}
      onDocumentChange={onDocumentChange}
      onSave={onSave}
      templateId={templateId}
      defaultLanguage={defaultLanguage}
      allStructures={allStructures}
    >
      <EmailBuilderInner height={height} />
    </EmailBuilderProvider>
  );
}

