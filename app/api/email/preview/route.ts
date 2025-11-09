/**
 * Email Preview API Endpoint
 * Sends test email to specified recipient
 * POST /api/email/preview
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

interface PreviewEmailRequest {
  html: string;
  subject: string;
  recipientEmail: string;
  fromEmail?: string;
  fromName?: string;
  templateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PreviewEmailRequest = await request.json();
    const { html, subject, recipientEmail, fromEmail, fromName, templateId } = body;

    if (!html || !subject || !recipientEmail) {
      return NextResponse.json(
        { error: "HTML, subject, and recipientEmail are required" },
        { status: 400 }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
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

    // Prepare email
    const from = fromEmail || smtpProfile.fromEmail;
    const fromString = fromName ? `"${fromName}" <${from}>` : from;

    const mailOptions = {
      from: fromString,
      to: recipientEmail,
      subject: `[TEST] ${subject}`,
      html: html,
      headers: {
        "X-Mailer": "MailCrafter",
        "X-Preview": "true",
      },
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);

    // Log email
    await prisma.emailLog.create({
      data: {
        templateId: templateId || "",
        recipientEmail: recipientEmail,
        status: "SENT",
        smtpResponse: JSON.stringify(info),
        sentAt: new Date(),
        campaignId: null,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: "Test email sent successfully",
    });
  } catch (error: any) {
    console.error("Preview email error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send preview email" },
      { status: 500 }
    );
  }
}

