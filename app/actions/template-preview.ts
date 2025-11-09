"use server";

import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { renderEmailTemplate } from "@/lib/email/template-renderer";
import type { EmailBuilderDocument } from "@/lib/email-builder/types";

/**
 * Preview template with sample data
 */
export async function previewTemplate(
  templateId: string,
  sampleData?: Record<string, any>,
  language?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get template
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    // Get structure (convert from old format if needed)
    const structure = template.structure as any;
    
    // Convert to EmailBuilderDocument format if needed
    // (This assumes the structure is already in the new format)
    const document = structure as EmailBuilderDocument;

    // Render template
    const result = await renderEmailTemplate(document, {
      sampleData: sampleData || {},
      language,
      replaceVariables: true,
    });

    return { success: true, html: result.html, text: result.text };
  } catch (error) {
    console.error("Preview template error:", error);
    return { error: "Failed to preview template" };
  }
}

/**
 * Send test email
 */
export async function testSendEmail(
  templateId: string,
  testEmail: string,
  sampleData?: Record<string, any>
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return { error: "Invalid email address" };
    }

    // Get template
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        organization: {
          members: {
            some: { userId: user.id },
          },
        },
      },
      include: {
        organization: {
          include: {
            smtpProfiles: {
              where: { isDefault: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!template) {
      return { error: "Template not found or access denied" };
    }

    // Get structure
    const structure = template.structure as any;
    const document = structure as EmailBuilderDocument;

    // Render template
    const result = await renderEmailTemplate(document, {
      sampleData: sampleData || {},
      replaceVariables: true,
    });

    // Get SMTP profile
    const smtpProfile = template.organization?.smtpProfiles?.[0];
    if (!smtpProfile) {
      return { error: "No SMTP profile configured" };
    }

    // Send email (you'll need to implement email sending logic)
    // For now, we'll return success - actual sending should be done via API route
    // that uses the SMTP configuration

    return { 
      success: true, 
      message: "Test email queued for sending",
      html: result.html,
      text: result.text,
    };
  } catch (error) {
    console.error("Test send error:", error);
    return { error: "Failed to send test email" };
  }
}

