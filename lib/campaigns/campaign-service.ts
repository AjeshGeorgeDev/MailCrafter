/**
 * Campaign Service
 * Handles campaign sending, pausing, resuming, and cancellation
 */

import { prisma } from "@/lib/db/prisma";
import { queueBulkEmails } from "@/app/actions/email-queue";
import { createEmailLog } from "@/lib/email/email-logger";
import { revalidatePath } from "next/cache";
import type { CSVRecipient } from "./csv-importer";

/**
 * Send campaign
 * Loads recipients and queues emails
 */
export async function sendCampaign(campaignId: string) {
  try {
    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: {
          select: {
            id: true,
            defaultLanguage: true,
          },
        },
        smtpProfile: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return { error: `Cannot send campaign with status: ${campaign.status}` };
    }

    if (!campaign.smtpProfile || !campaign.smtpProfile.isActive) {
      return { error: "No active SMTP profile configured" };
    }

    // Load recipients from CampaignRecipient table
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId },
    });

    if (recipients.length === 0) {
      return { error: "No recipients configured for this campaign" };
    }

    // Update campaign status to SENDING and set recipient count
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
        startedAt: new Date(),
        recipientCount: recipients.length,
      },
    });

    // Create EmailLog entries and prepare recipients
    const emailLogs = [];
    const recipientsData = [];
    
    for (const recipient of recipients) {
      // Create email log entry
      const emailLog = await createEmailLog({
        templateId: campaign.templateId,
        recipientEmail: recipient.email,
        languageCode: campaign.template.defaultLanguage,
        variables: (recipient.variables as Record<string, any>) || {},
        campaignId,
        status: "QUEUED",
      });

      emailLogs.push(emailLog);
      recipientsData.push({
        email: recipient.email,
        name: recipient.name || undefined,
        variables: (recipient.variables as Record<string, any>) || {},
      });
    }

    // Queue all emails in bulk
    const queueResult = await queueBulkEmails({
      templateId: campaign.templateId,
      recipients: recipientsData,
      languageCode: campaign.template.defaultLanguage,
      smtpProfileId: campaign.smtpProfile!.id,
      campaignId,
      subject: campaign.subject,
      priority: 0,
    });

    if (queueResult.error) {
      // Update email logs to failed status
      for (const emailLog of emailLogs) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: { status: "FAILED", errorMessage: queueResult.error },
        });
      }
      return { error: queueResult.error };
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true, message: "Campaign sending started", queued: recipientsData.length };
  } catch (error) {
    console.error("Send campaign error:", error);
    return { error: "Failed to send campaign" };
  }
}

/**
 * Pause campaign
 */
export async function pauseCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    if (campaign.status !== "SENDING") {
      return { error: "Can only pause campaigns that are currently sending" };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "PAUSED",
      },
    });

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error("Pause campaign error:", error);
    return { error: "Failed to pause campaign" };
  }
}

/**
 * Resume campaign
 */
export async function resumeCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    if (campaign.status !== "PAUSED") {
      return { error: "Can only resume paused campaigns" };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
      },
    });

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error("Resume campaign error:", error);
    return { error: "Failed to resume campaign" };
  }
}

/**
 * Cancel campaign
 */
export async function cancelCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    if (!["DRAFT", "SCHEDULED", "SENDING", "PAUSED"].includes(campaign.status)) {
      return { error: "Cannot cancel campaign with current status" };
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "DRAFT",
        scheduledAt: null,
      },
    });

    // TODO: Cancel queued jobs if campaign was sending

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error("Cancel campaign error:", error);
    return { error: "Failed to cancel campaign" };
  }
}

/**
 * Update campaign progress
 * Called by worker or scheduled job to update sending progress
 */
export async function updateCampaignProgress(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: {
          select: {
            emailLogs: true,
          },
        },
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    // Get email log counts
    const [sentCount, failedCount, totalCount] = await Promise.all([
      prisma.emailLog.count({
        where: {
          campaignId,
          status: "SENT",
        },
      }),
      prisma.emailLog.count({
        where: {
          campaignId,
          status: "FAILED",
        },
      }),
      prisma.emailLog.count({
        where: { campaignId },
      }),
    ]);

    // Calculate progress
    const progress =
      campaign.recipientCount > 0
        ? ((sentCount + failedCount) / campaign.recipientCount) * 100
        : 0;

    // Check if completed
    const isCompleted =
      sentCount + failedCount >= campaign.recipientCount &&
      campaign.status === "SENDING";

    // Update campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount,
        failedCount,
        progress: Math.min(100, progress),
        ...(isCompleted && {
          status: "COMPLETED",
          completedAt: new Date(),
        }),
      },
    });

    return { success: true, sentCount, failedCount, progress, isCompleted };
  } catch (error) {
    console.error("Update campaign progress error:", error);
    return { error: "Failed to update campaign progress" };
  }
}

