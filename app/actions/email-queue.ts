"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { addEmailJob, addBulkJobs, getJobStatus, cancelJob, retryJob, getQueueStats, type EmailJob } from "@/lib/queue/queue-service";
import { revalidatePath } from "next/cache";

/**
 * Queue single email
 */
export async function queueEmail(data: {
  templateId: string;
  recipientEmail: string;
  recipientName?: string;
  variables?: Record<string, any>;
  languageCode?: string;
  smtpProfileId?: string;
  campaignId?: string;
  subject?: string;
  delay?: number; // Delay in milliseconds
  priority?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Get default SMTP profile if not provided
    let smtpProfileId = data.smtpProfileId;
    if (!smtpProfileId) {
      const defaultProfile = await prisma.smtpProfile.findFirst({
        where: {
          organizationId: orgMember.organization.id,
          isDefault: true,
          isActive: true,
        },
        select: { id: true },
      });

      if (!defaultProfile) {
        return { error: "No SMTP profile configured. Please set up an SMTP profile first." };
      }

      smtpProfileId = defaultProfile.id;
    }

    // Verify template exists
    const template = await prisma.template.findFirst({
      where: {
        id: data.templateId,
        organizationId: orgMember.organization.id,
      },
      select: { id: true },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    // Create email job
    const emailJob: EmailJob = {
      templateId: data.templateId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      variables: data.variables || {},
      languageCode: data.languageCode || "en",
      smtpProfileId,
      organizationId: orgMember.organization.id,
      campaignId: data.campaignId,
      priority: data.priority,
      subject: data.subject,
    };

    // Add to queue
    const job = await addEmailJob(emailJob, {
      delay: data.delay || 0,
      priority: data.priority,
      queue: data.delay ? "scheduled" : "immediate",
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("Queue email error:", error);
    return { error: "Failed to queue email" };
  }
}

/**
 * Queue bulk emails
 */
export async function queueBulkEmails(data: {
  templateId: string;
  recipients: Array<{
    email: string;
    name?: string;
    variables?: Record<string, any>;
  }>;
  languageCode?: string;
  smtpProfileId?: string;
  campaignId?: string;
  subject?: string;
  delay?: number;
  priority?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Get default SMTP profile if not provided
    let smtpProfileId = data.smtpProfileId;
    if (!smtpProfileId) {
      const defaultProfile = await prisma.smtpProfile.findFirst({
        where: {
          organizationId: orgMember.organization.id,
          isDefault: true,
          isActive: true,
        },
        select: { id: true },
      });

      if (!defaultProfile) {
        return { error: "No SMTP profile configured" };
      }

      smtpProfileId = defaultProfile.id;
    }

    // Verify template exists
    const template = await prisma.template.findFirst({
      where: {
        id: data.templateId,
        organizationId: orgMember.organization.id,
      },
      select: { id: true },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    // Create email jobs
    const emailJobs: EmailJob[] = data.recipients.map((recipient) => ({
      templateId: data.templateId,
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      variables: recipient.variables || {},
      languageCode: data.languageCode || "en",
      smtpProfileId,
      organizationId: orgMember.organization.id,
      campaignId: data.campaignId,
      priority: data.priority,
      subject: data.subject,
    }));

    // Add to bulk queue
    const jobs = await addBulkJobs(emailJobs, {
      delay: data.delay || 0,
      priority: data.priority,
      queue: "bulk",
    });

    return {
      success: true,
      jobIds: jobs.map((job) => job.id),
      count: jobs.length,
    };
  } catch (error) {
    console.error("Queue bulk emails error:", error);
    return { error: "Failed to queue bulk emails" };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStatistics() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const stats = await getQueueStats();
    return { success: true, stats };
  } catch (error) {
    console.error("Get queue stats error:", error);
    return { error: "Failed to get queue statistics" };
  }
}

/**
 * Get job status
 */
export async function getEmailJobStatus(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const job = await getJobStatus(jobId, queueName);
    if (!job) {
      return { error: "Job not found" };
    }

    return {
      success: true,
      job: {
        id: job.id,
        data: job.data,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        state: await job.getState(),
      },
    };
  } catch (error) {
    console.error("Get job status error:", error);
    return { error: "Failed to get job status" };
  }
}

/**
 * Cancel job
 */
export async function cancelEmailJob(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const cancelled = await cancelJob(jobId, queueName);
    if (!cancelled) {
      return { error: "Job not found or cannot be cancelled" };
    }

    return { success: true };
  } catch (error) {
    console.error("Cancel job error:", error);
    return { error: "Failed to cancel job" };
  }
}

/**
 * Retry failed job
 */
export async function retryEmailJob(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const retried = await retryJob(jobId, queueName);
    if (!retried) {
      return { error: "Job not found or cannot be retried" };
    }

    return { success: true };
  } catch (error) {
    console.error("Retry job error:", error);
    return { error: "Failed to retry job" };
  }
}

