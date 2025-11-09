/**
 * Email Worker Process
 * Processes email jobs from Bull queues
 * 
 * Run this as a separate process: npm run worker
 */

import {
  immediateEmailQueue,
  scheduledEmailQueue,
  bulkEmailQueue,
  closeAllQueues,
} from "../lib/queue/email-queue";
import { CONCURRENCY, RETRY_DELAYS } from "../lib/queue/config";
import { checkRateLimit } from "../lib/queue/rate-limiter";
import { sendEmail } from "../lib/email/email-service";
import { renderEmailTemplate } from "../lib/email/template-renderer";
import { getTemplateLanguage } from "../lib/templates/template-language-helpers";
import { injectTracking } from "../lib/email/tracking";
import { prisma } from "../lib/db/prisma";
import type { EmailJob } from "../lib/queue/queue-service";

/**
 * Process email job
 */
async function processEmailJob(job: any): Promise<void> {
  const data: EmailJob = job.data;
  const jobId = job.id;
  const attemptNumber = job.attemptsMade + 1;

  console.log(`[Worker] Processing job ${jobId} (attempt ${attemptNumber})`);
  console.log(`[Worker] Email: ${data.recipientEmail}, Template: ${data.templateId}`);

  let emailLogId = data.emailLogId;

  try {
    // 1. Create or get EmailLog entry
    if (!emailLogId) {
      const emailLog = await prisma.emailLog.create({
        data: {
          templateId: data.templateId,
          recipientEmail: data.recipientEmail,
          languageCode: data.languageCode,
          variables: data.variables || {},
          status: "SENDING",
          campaignId: data.campaignId || null,
          retryCount: attemptNumber - 1,
        },
      });
      emailLogId = emailLog.id;
    } else {
      // Update existing log
      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: "SENDING",
          retryCount: attemptNumber - 1,
        },
      });
    }

    // 2. Check rate limit
    const smtpProfile = await prisma.smtpProfile.findUnique({
      where: { id: data.smtpProfileId },
      select: { maxHourlyRate: true, isActive: true },
    });

    if (!smtpProfile || !smtpProfile.isActive) {
      throw new Error("SMTP profile not found or inactive");
    }

    const rateLimit = await checkRateLimit(
      data.smtpProfileId,
      smtpProfile.maxHourlyRate
    );

    if (!rateLimit.allowed) {
      const delay = rateLimit.resetAt.getTime() - Date.now();
      console.log(
        `[Worker] Rate limit exceeded for profile ${data.smtpProfileId}. Delaying job by ${delay}ms`
      );
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimit.resetAt.toISOString()}`
      );
    }

    // 3. Load template structure
    const templateStructure = await getTemplateLanguage(
      data.templateId,
      data.languageCode
    );

    if (!templateStructure) {
      throw new Error(
        `Template structure not found for language: ${data.languageCode}`
      );
    }

    // 4. Render template with variables
    let { html, text } = await renderEmailTemplate(templateStructure, {
      sampleData: data.variables || {},
      replaceVariables: true,
      language: data.languageCode,
      templateId: data.templateId,
    });

    // 4a. Check if email is suppressed (bounced) or unsubscribed
    const { isEmailSuppressed } = await import("@/lib/email/bounce-handler");
    const { isUnsubscribed } = await import("@/app/actions/unsubscribe");
    
    const [isSuppressed, isUnsub] = await Promise.all([
      isEmailSuppressed(data.recipientEmail),
      isUnsubscribed(data.recipientEmail, data.campaignId || undefined),
    ]);
    
    if (isSuppressed) {
      throw new Error("Email address is suppressed due to previous bounces");
    }
    
    if (isUnsub) {
      throw new Error("Email address has unsubscribed");
    }

    // 4b. Inject tracking (open pixel and click tracking)
    html = injectTracking(html, emailLogId, {
      trackOpens: true,
      trackClicks: true,
    });

    // 4c. Generate unsubscribe URLs
    const {
      generateUnsubscribeUrl,
      generatePreferenceCenterUrl,
    } = await import("@/lib/email/unsubscribe");
    const unsubscribeUrl = generateUnsubscribeUrl(
      data.recipientEmail,
      data.campaignId || undefined
    );
    const preferenceUrl = generatePreferenceCenterUrl(data.recipientEmail);

    // Add unsubscribe footer to HTML
    const unsubscribeFooter = `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
        <p>
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
          | 
          <a href="${preferenceUrl}" style="color: #6b7280; text-decoration: underline;">Manage Preferences</a>
        </p>
      </div>
    `;
    // Insert before </body> or append if no body tag
    if (html.includes("</body>")) {
      html = html.replace("</body>", `${unsubscribeFooter}</body>`);
    } else {
      html = html + unsubscribeFooter;
    }

    // 6. Get template for subject (if not provided)
    let subject = data.subject;
    if (!subject) {
      const template = await prisma.template.findUnique({
        where: { id: data.templateId },
        select: { name: true },
      });
      subject = template?.name || "Email";
    }

    // Replace variables in subject
    if (data.variables) {
      Object.entries(data.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        subject = subject?.replace(regex, String(value)) || subject;
      });
    }

    // 6. Send email with unsubscribe headers
    const messageId = await sendEmail({
      smtpProfileId: data.smtpProfileId,
      to: data.recipientEmail,
      subject: subject || "Email",
      html,
      text,
      from: data.fromEmail,
      fromName: data.fromName,
      headers: {
        unsubscribeUrl,
      },
    });

    // 7. Update EmailLog as sent
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: "SENT",
        smtpResponse: JSON.stringify({ messageId }),
        sentAt: new Date(),
        retryCount: attemptNumber - 1,
      },
    });

    console.log(`[Worker] Job ${jobId} completed successfully. MessageId: ${messageId}`);
  } catch (error: any) {
    console.error(`[Worker] Job ${jobId} failed:`, error.message);

    // Determine if error is retryable
    const isRetryable = isRetryableError(error);

    // Update EmailLog
    if (emailLogId) {
      // Check if this is a bounce error
      const isBounceError =
        error.message?.toLowerCase().includes("bounce") ||
        error.message?.toLowerCase().includes("550") ||
        error.message?.toLowerCase().includes("mailbox") ||
        error.message?.toLowerCase().includes("user unknown") ||
        error.message?.toLowerCase().includes("invalid recipient");

      if (isBounceError) {
        // Process bounce
        const { processBounce } = await import("@/lib/email/bounce-handler");
        await processBounce(data.recipientEmail, error.message || "Bounce error");

        // Log bounce event
        await prisma.emailEvent.create({
          data: {
            emailLogId,
            eventType: "BOUNCED",
            metadata: { error: error.message },
          },
        });
      }

      await prisma.emailLog.update({
        where: { id: emailLogId },
        data: {
          status: isBounceError ? "BOUNCED" : isRetryable ? "QUEUED" : "FAILED",
          errorMessage: error.message,
          retryCount: attemptNumber,
        },
      });
    }

    // If not retryable, fail the job
    if (!isRetryable) {
      throw error;
    }

    // For retryable errors, let Bull handle retry with backoff
    throw error;
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const errorMessage = error.message?.toLowerCase() || "";
  const errorCode = error.code?.toLowerCase() || "";

  // Permanent failures (don't retry)
  const permanentErrors = [
    "invalid email",
    "email not found",
    "user not found",
    "template not found",
    "smtp profile not found",
    "rate limit exceeded", // Will be retried after delay
  ];

  // Check for permanent errors
  for (const permanentError of permanentErrors) {
    if (errorMessage.includes(permanentError)) {
      // Rate limit is special - it's retryable but with delay
      if (permanentError === "rate limit exceeded") {
        return true;
      }
      return false;
    }
  }

  // Network errors are retryable
  if (
    errorCode.includes("timeout") ||
    errorCode.includes("econnrefused") ||
    errorCode.includes("enotfound") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("connection")
  ) {
    return true;
  }

  // Authentication errors are usually permanent
  if (errorCode === "eauth" || errorMessage.includes("authentication")) {
    return false;
  }

  // Default: retryable
  return true;
}

/**
 * Setup queue processors
 */
function setupProcessors() {
  // Process immediate emails
  immediateEmailQueue.process(CONCURRENCY.IMMEDIATE, async (job) => {
    return processEmailJob(job);
  });

  // Process scheduled emails
  scheduledEmailQueue.process(CONCURRENCY.SCHEDULED, async (job) => {
    return processEmailJob(job);
  });

  // Process bulk emails
  bulkEmailQueue.process(CONCURRENCY.BULK, async (job) => {
    return processEmailJob(job);
  });

  console.log("[Worker] Processors setup complete");
  console.log(`[Worker] Concurrency - Immediate: ${CONCURRENCY.IMMEDIATE}, Scheduled: ${CONCURRENCY.SCHEDULED}, Bulk: ${CONCURRENCY.BULK}`);
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown() {
  console.log("[Worker] Shutting down gracefully...");

  // Close all queues
  await closeAllQueues();

  // Close Prisma connection
  await prisma.$disconnect();

  console.log("[Worker] Shutdown complete");
  process.exit(0);
}

// Setup signal handlers
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Worker] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Worker] Uncaught Exception:", error);
  gracefulShutdown();
});

// Start processing
console.log("[Worker] Starting email worker...");
setupProcessors();
console.log("[Worker] Email worker started and ready to process jobs");

