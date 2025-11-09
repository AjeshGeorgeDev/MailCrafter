/**
 * Send Email API Endpoint
 * POST /api/email/send
 * 
 * If templateId is provided, emails are queued for processing.
 * If only HTML is provided, emails are sent directly (legacy mode).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { queueEmail, queueBulkEmails } from "@/app/actions/email-queue";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

interface SendEmailRequest {
  html?: string;
  subject: string;
  recipients: string[];
  fromEmail?: string;
  fromName?: string;
  templateId?: string;
  variables?: Record<string, any>; // For template-based emails
  languageCode?: string; // For template-based emails
  useQueue?: boolean; // Force queue usage even with raw HTML
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SendEmailRequest = await request.json();
    const {
      html,
      subject,
      recipients,
      fromEmail,
      fromName,
      templateId,
      variables,
      languageCode,
      useQueue,
    } = body;

    if (!subject || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Subject and recipients are required" },
        { status: 400 }
      );
    }

    // If templateId is provided, use queue system
    // If useQueue is true, also use queue (even with raw HTML)
    if (templateId || useQueue) {
      if (!templateId) {
        return NextResponse.json(
          { error: "templateId is required when using queue" },
          { status: 400 }
        );
      }

      // Queue emails using the queue system
      const jobResults = await queueBulkEmails({
        templateId,
        recipients: recipients.map((email) => ({
          email,
          variables: variables || {},
        })),
        languageCode: languageCode || "en",
        subject,
        priority: 0,
      });

      if (jobResults.error) {
        return NextResponse.json(
          { error: jobResults.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        queued: jobResults.count || recipients.length,
        jobIds: jobResults.jobIds,
        message: "Emails queued for processing",
      });
    }

    // Legacy mode: Direct sending (requires HTML)
    if (!html) {
      return NextResponse.json(
        { error: "HTML is required when not using templateId" },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          include: {
            smtpProfiles: {
              where: {
                isActive: true,
                isDefault: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!orgMember?.organization) {
      return NextResponse.json(
        { error: "User organization not found" },
        { status: 400 }
      );
    }

    const smtpProfile = orgMember.organization.smtpProfiles[0];

    if (!smtpProfile) {
      return NextResponse.json(
        { error: "No active SMTP profile found. Please configure SMTP settings." },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpProfile.host,
      port: smtpProfile.port,
      secure: smtpProfile.encryption === "SSL",
      auth: {
        user: smtpProfile.username,
        pass: smtpProfile.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send emails
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: fromEmail || smtpProfile.fromEmail,
          to: recipient,
          subject: subject,
          html: html,
          headers: {
            "X-Mailer": "MailCrafter",
          },
        };

        if (fromName) {
          mailOptions.from = `"${fromName}" <${mailOptions.from}>`;
        }

        const info = await transporter.sendMail(mailOptions);

        // Log email
        await prisma.emailLog.create({
          data: {
            templateId: templateId || "",
            recipientEmail: recipient,
            status: "SENT",
            smtpResponse: JSON.stringify(info),
            sentAt: new Date(),
            campaignId: null,
          },
        });

        results.push({
          email: recipient,
          messageId: info.messageId,
          status: "sent",
        });
      } catch (error: any) {
        console.error(`Error sending to ${recipient}:`, error);

        // Log failed email
        await prisma.emailLog.create({
          data: {
            templateId: templateId || "",
            recipientEmail: recipient,
            status: "FAILED",
            errorMessage: error.message,
            campaignId: null,
          },
        });

        errors.push({
          email: recipient,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

