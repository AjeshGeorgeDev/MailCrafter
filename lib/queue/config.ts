/**
 * Queue Configuration
 * Redis connection and Bull queue settings
 */

import Redis from "ioredis";

/**
 * Get Redis connection
 */
export function getRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true; // Reconnect on READONLY error
      }
      return false;
    },
  });
}

/**
 * Default job options for email queues
 */
export const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 5 * 60 * 1000, // Start with 5 minutes
  },
  removeOnComplete: {
    age: 24 * 60 * 60, // Keep completed jobs for 24 hours
    count: 1000, // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
  },
};

/**
 * Queue options
 */
export const queueOptions = {
  defaultJobOptions,
  settings: {
    stalledInterval: 30 * 1000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 1, // Max times a job can be stalled before failing
  },
};

/**
 * Concurrency limits
 */
export const CONCURRENCY = {
  IMMEDIATE: parseInt(process.env.QUEUE_CONCURRENCY_IMMEDIATE || "5", 10),
  SCHEDULED: parseInt(process.env.QUEUE_CONCURRENCY_SCHEDULED || "3", 10),
  BULK: parseInt(process.env.QUEUE_CONCURRENCY_BULK || "10", 10),
};

/**
 * Retry delays (in milliseconds)
 * Exponential backoff: 5m, 10m, 20m, 40m, 80m
 */
export const RETRY_DELAYS = [
  5 * 60 * 1000,   // 5 minutes
  10 * 60 * 1000,  // 10 minutes
  20 * 60 * 1000,  // 20 minutes
  40 * 60 * 1000,  // 40 minutes
  80 * 60 * 1000,  // 80 minutes
];

