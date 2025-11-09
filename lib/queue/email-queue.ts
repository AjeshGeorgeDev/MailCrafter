/**
 * Email Queue Instances
 * Create and export Bull queues for email processing
 */

import Queue from "bull";
import { getRedisConnection, queueOptions, CONCURRENCY } from "./config";

// Redis connection
const redis = getRedisConnection();

/**
 * Immediate Email Queue
 * For emails that should be sent immediately
 */
export const immediateEmailQueue = new Queue("immediate-email", {
  redis: redis as any, // Bull accepts Redis instance but types are strict
  ...queueOptions,
} as any);

/**
 * Scheduled Email Queue
 * For emails scheduled for future delivery
 */
export const scheduledEmailQueue = new Queue("scheduled-email", {
  redis: redis as any, // Bull accepts Redis instance but types are strict
  ...queueOptions,
} as any);

/**
 * Bulk Email Queue
 * For bulk campaign emails
 */
export const bulkEmailQueue = new Queue("bulk-email", {
  redis: redis as any, // Bull accepts Redis instance but types are strict
  ...queueOptions,
} as any);

/**
 * Queue event handlers for monitoring
 */
export function setupQueueEventHandlers() {
  const queues = [immediateEmailQueue, scheduledEmailQueue, bulkEmailQueue];

  queues.forEach((queue) => {
    queue.on("completed", (job) => {
      console.log(`[Queue ${queue.name}] Job ${job.id} completed`);
    });

    queue.on("failed", (job, err) => {
      console.error(`[Queue ${queue.name}] Job ${job?.id} failed:`, err.message);
    });

    queue.on("stalled", (job) => {
      console.warn(`[Queue ${queue.name}] Job ${job.id} stalled`);
    });

    queue.on("error", (error) => {
      console.error(`[Queue ${queue.name}] Error:`, error);
    });
  });
}

// Setup event handlers
setupQueueEventHandlers();

/**
 * Close all queues (for graceful shutdown)
 */
export async function closeAllQueues() {
  await Promise.all([
    immediateEmailQueue.close(),
    scheduledEmailQueue.close(),
    bulkEmailQueue.close(),
  ]);
  redis.disconnect();
}

