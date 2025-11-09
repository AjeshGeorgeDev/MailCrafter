/**
 * Queue Service
 * High-level interface for queue operations
 */

import QueueDefault, { Job } from "bull";
import type { Queue as QueueType } from "bull";
import {
  immediateEmailQueue,
  scheduledEmailQueue,
  bulkEmailQueue,
} from "./email-queue";
import { RETRY_DELAYS } from "./config";

/**
 * Email Job Data Structure
 */
export interface EmailJob {
  templateId: string;
  recipientEmail: string;
  recipientName?: string;
  variables: Record<string, any>;
  languageCode: string;
  smtpProfileId: string;
  organizationId: string;
  campaignId?: string;
  emailLogId?: string; // Optional: if EmailLog already created
  priority?: number; // Higher number = higher priority
  subject?: string; // Optional: override template subject
  fromEmail?: string; // Optional: override profile fromEmail
  fromName?: string; // Optional: override profile fromName
}

/**
 * Add email job to appropriate queue
 */
export async function addEmailJob(
  data: EmailJob,
  options: {
    delay?: number; // Delay in milliseconds (for scheduled emails)
    priority?: number; // Job priority
    queue?: "immediate" | "scheduled" | "bulk"; // Queue selection
  } = {}
): Promise<Job<EmailJob>> {
  const { delay, priority, queue = "immediate" } = options;

  // Select queue based on type
  let selectedQueue: QueueType<EmailJob>;
  switch (queue) {
    case "scheduled":
      selectedQueue = scheduledEmailQueue;
      break;
    case "bulk":
      selectedQueue = bulkEmailQueue;
      break;
    default:
      selectedQueue = immediateEmailQueue;
  }

  // Add job with options
  const job = await selectedQueue.add(data, {
    priority: priority || data.priority || 0,
    delay: delay || 0,
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: RETRY_DELAYS[0],
    },
  });

  return job;
}

/**
 * Add multiple email jobs (batch)
 */
export async function addBulkJobs(
  jobs: EmailJob[],
  options: {
    delay?: number;
    priority?: number;
    queue?: "immediate" | "scheduled" | "bulk";
  } = {}
): Promise<Job<EmailJob>[]> {
  const { delay, priority, queue = "bulk" } = options;

  let selectedQueue: QueueType<EmailJob>;
  switch (queue) {
    case "scheduled":
      selectedQueue = scheduledEmailQueue;
      break;
    case "bulk":
      selectedQueue = bulkEmailQueue;
      break;
    default:
      selectedQueue = immediateEmailQueue;
  }

  // Add all jobs
  const jobPromises = jobs.map((data) =>
    selectedQueue.add(data, {
      priority: priority || data.priority || 0,
      delay: delay || 0,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: RETRY_DELAYS[0],
      },
    })
  );

  return Promise.all(jobPromises);
}

/**
 * Get job status
 */
export async function getJobStatus(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
): Promise<Job<EmailJob> | null> {
  let queue: QueueType<EmailJob>;
  switch (queueName) {
    case "scheduled":
      queue = scheduledEmailQueue;
      break;
    case "bulk":
      queue = bulkEmailQueue;
      break;
    default:
      queue = immediateEmailQueue;
  }

  const job = await queue.getJob(jobId);
  return job;
}

/**
 * Cancel job
 */
export async function cancelJob(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
): Promise<boolean> {
  const job = await getJobStatus(jobId, queueName);
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}

/**
 * Retry failed job
 */
export async function retryJob(
  jobId: string,
  queueName: "immediate" | "scheduled" | "bulk" = "immediate"
): Promise<boolean> {
  const job = await getJobStatus(jobId, queueName);
  if (!job) {
    return false;
  }

  await job.retry();
  return true;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [immediate, scheduled, bulk] = await Promise.all([
    immediateEmailQueue.getJobCounts(),
    scheduledEmailQueue.getJobCounts(),
    bulkEmailQueue.getJobCounts(),
  ]);

  return {
    immediate: {
      waiting: immediate.waiting,
      active: immediate.active,
      completed: immediate.completed,
      failed: immediate.failed,
      delayed: immediate.delayed,
    },
    scheduled: {
      waiting: scheduled.waiting,
      active: scheduled.active,
      completed: scheduled.completed,
      failed: scheduled.failed,
      delayed: scheduled.delayed,
    },
    bulk: {
      waiting: bulk.waiting,
      active: bulk.active,
      completed: bulk.completed,
      failed: bulk.failed,
      delayed: bulk.delayed,
    },
  };
}

