/**
 * Email Queue Instances
 * Create and export Bull queues for email processing
 * Uses lazy initialization to avoid connecting during Next.js build
 */

import QueueDefault from "bull";
import type { Queue as QueueType } from "bull";
import { getRedisConnection, queueOptions, CONCURRENCY } from "./config";

// Lazy initialization - only create queues when actually needed (at runtime, not build time)
let redis: ReturnType<typeof getRedisConnection> | null = null;
let _immediateEmailQueue: QueueType | null = null;
let _scheduledEmailQueue: QueueType | null = null;
let _bulkEmailQueue: QueueType | null = null;

function getRedis() {
  if (!redis) {
    redis = getRedisConnection();
  }
  return redis;
}

function initializeQueues() {
  if (_immediateEmailQueue && _scheduledEmailQueue && _bulkEmailQueue) {
    return; // Already initialized
  }

  // Get Redis URL from environment - Bull Queue can accept connection string directly
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  console.log(`[Queue Init] Initializing queues with Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);

  // Bull Queue accepts connection string, which is more reliable than passing a Redis instance
  // This ensures Bull uses the correct Redis URL from environment
  const redisConfig = redisUrl;

  if (!_immediateEmailQueue) {
    _immediateEmailQueue = new QueueDefault("immediate-email", {
      redis: redisConfig,
      ...queueOptions,
    } as any);
  }

  if (!_scheduledEmailQueue) {
    _scheduledEmailQueue = new QueueDefault("scheduled-email", {
      redis: redisConfig,
      ...queueOptions,
    } as any);
  }

  if (!_bulkEmailQueue) {
    _bulkEmailQueue = new QueueDefault("bulk-email", {
      redis: redisConfig,
      ...queueOptions,
    } as any);
  }

  // Setup event handlers only once
  setupQueueEventHandlers();
}

/**
 * Immediate Email Queue
 * For emails that should be sent immediately
 */
export function getImmediateEmailQueue(): QueueType {
  initializeQueues();
  return _immediateEmailQueue!;
}

/**
 * Scheduled Email Queue
 * For emails scheduled for future delivery
 */
export function getScheduledEmailQueue(): QueueType {
  initializeQueues();
  return _scheduledEmailQueue!;
}

/**
 * Bulk Email Queue
 * For bulk campaign emails
 */
export function getBulkEmailQueue(): QueueType {
  initializeQueues();
  return _bulkEmailQueue!;
}

// Export as properties for backward compatibility (lazy getters)
// Use a more robust Proxy that handles all methods including delayed, add, etc.
function createQueueProxy(getQueue: () => QueueType): QueueType {
  return new Proxy({} as QueueType, {
    get(target, prop) {
      const queue = getQueue();
      const value = queue[prop as keyof QueueType];
      // If it's a function, bind it to the queue instance
      if (typeof value === 'function') {
        return value.bind(queue);
      }
      return value;
    },
    has(target, prop) {
      const queue = getQueue();
      return prop in queue;
    },
    ownKeys(target) {
      const queue = getQueue();
      return Reflect.ownKeys(queue);
    },
    getOwnPropertyDescriptor(target, prop) {
      const queue = getQueue();
      return Reflect.getOwnPropertyDescriptor(queue, prop);
    },
  }) as QueueType;
}

export const immediateEmailQueue = createQueueProxy(getImmediateEmailQueue);
export const scheduledEmailQueue = createQueueProxy(getScheduledEmailQueue);
export const bulkEmailQueue = createQueueProxy(getBulkEmailQueue);

/**
 * Queue event handlers for monitoring
 */
function setupQueueEventHandlers() {
  const queues = [_immediateEmailQueue, _scheduledEmailQueue, _bulkEmailQueue].filter(Boolean) as QueueType[];

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

/**
 * Close all queues (for graceful shutdown)
 */
export async function closeAllQueues() {
  await Promise.all([
    _immediateEmailQueue?.close(),
    _scheduledEmailQueue?.close(),
    _bulkEmailQueue?.close(),
  ].filter(Boolean));
  if (redis) {
    redis.disconnect();
  }
}
