/**
 * Email Actions Hook
 * Handles sending emails and preview emails
 */

import { useState } from "react";
import { toast } from "sonner";
import { renderEmailTemplate } from "@/lib/email/template-renderer";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";

interface UseEmailActionsOptions {
  templateId?: string;
  templateName?: string;
}

export function useEmailActions({
  templateId,
  templateName,
}: UseEmailActionsOptions = {}) {
  const [isSending, setIsSending] = useState(false);
  const [isSendingPreview, setIsSendingPreview] = useState(false);

  const sendPreviewEmail = async (
    document: EmailBuilderDocument,
    recipientEmail: string,
    subject: string,
    language?: string,
    sampleData?: Record<string, any>,
    defaultLanguage?: string
  ): Promise<boolean> => {
    setIsSendingPreview(true);

    try {
      // Render template with language support
      const { html } = await renderEmailTemplate(document, {
        sampleData: sampleData || {},
        replaceVariables: true,
        language: language,
        templateId: templateId,
        defaultLanguage: defaultLanguage || "en",
      });

      const response = await fetch("/api/email/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          subject: subject || `${templateName || "Email Template"} - Test`,
          recipientEmail,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send preview email");
      }

      toast.success("Preview email sent successfully");
      return true;
    } catch (error: any) {
      console.error("Send preview error:", error);
      toast.error(error.message || "Failed to send preview email");
      return false;
    } finally {
      setIsSendingPreview(false);
    }
  };

  const sendEmails = async (
    document: EmailBuilderDocument,
    recipients: string[],
    subject: string,
    fromEmail?: string,
    fromName?: string,
    language?: string,
    sampleData?: Record<string, any>,
    defaultLanguage?: string
  ): Promise<boolean> => {
    setIsSending(true);

    try {
      // Render template with language support
      const { html } = await renderEmailTemplate(document, {
        sampleData: sampleData || {},
        replaceVariables: true,
        language: language,
        templateId: templateId,
        defaultLanguage: defaultLanguage || "en",
      });

      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html,
          subject,
          recipients,
          fromEmail,
          fromName,
          templateId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send emails");
      }

      toast.success(`Emails sent: ${data.sent} successful, ${data.failed} failed`);
      return true;
    } catch (error: any) {
      console.error("Send emails error:", error);
      toast.error(error.message || "Failed to send emails");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendPreviewEmail,
    sendEmails,
    isSending,
    isSendingPreview,
  };
}

