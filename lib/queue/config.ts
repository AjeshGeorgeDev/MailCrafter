/**
 * Queue Configuration
 * Redis connection and Bull queue settings
 */

import Redis from "ioredis";

/**
 * Get Redis connection
 */
// Cache for Redis connections to avoid creating multiple connections
let redisConnectionCache: Redis | null = null;
let redisUrlCache: string | null = null;

export function getRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  
  // Always log for debugging in Docker
  console.log(`[Redis Config] REDIS_URL from env: ${process.env.REDIS_URL || 'NOT SET'}`);
  console.log(`[Redis Config] Using Redis URL: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
  
  // If we have a cached connection with the same URL, reuse it
  if (redisConnectionCache && redisUrlCache === redisUrl) {
    // Check if connection is still alive
    if (redisConnectionCache.status === 'ready' || redisConnectionCache.status === 'connect') {
      return redisConnectionCache;
    }
    // Connection is dead, create a new one
    redisConnectionCache.disconnect();
    redisConnectionCache = null;
  }
  
  // Create new connection
  const redis = new Redis(redisUrl, {
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
    // Enable ready event to know when connection is established
    enableReadyCheck: true,
    // Lazy connect - don't connect immediately
    lazyConnect: false,
  });
  
  // Cache the connection
  redisConnectionCache = redis;
  redisUrlCache = redisUrl;
  
  // Log connection events
  redis.on('connect', () => {
    console.log(`[Redis] Connected to: ${redisUrl.replace(/:[^:@]+@/, ':****@')}`);
  });
  
  redis.on('error', (err) => {
    console.error(`[Redis] Connection error:`, err.message);
  });
  
  redis.on('close', () => {
    console.log(`[Redis] Connection closed`);
    // Clear cache on close
    if (redisConnectionCache === redis) {
      redisConnectionCache = null;
      redisUrlCache = null;
    }
  });
  
  return redis;
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

