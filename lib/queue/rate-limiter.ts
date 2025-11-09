/**
 * Rate Limiter
 * Distributed rate limiting using Redis
 */

import { getRedisConnection } from "./config";

const redis = getRedisConnection();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check rate limit for SMTP profile
 * @param smtpProfileId SMTP profile ID
 * @param maxHourlyRate Maximum emails per hour (from profile or default)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  smtpProfileId: string,
  maxHourlyRate?: number | null
): Promise<RateLimitResult> {
  // If no rate limit specified, allow
  if (!maxHourlyRate || maxHourlyRate <= 0) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    };
  }

  const key = `rate_limit:smtp:${smtpProfileId}`;
  const window = 60 * 60; // 1 hour in seconds
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / window) * window;

  // Use Redis sliding window counter
  const currentCount = await redis.incr(`${key}:${windowStart}`);
  
  // Set expiration for the counter key
  await redis.expire(`${key}:${windowStart}`, window);

  const remaining = Math.max(0, maxHourlyRate - currentCount);
  const resetAt = new Date((windowStart + window) * 1000);

  return {
    allowed: currentCount <= maxHourlyRate,
    remaining,
    resetAt,
  };
}

/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  smtpProfileId: string,
  maxHourlyRate?: number | null
): Promise<RateLimitResult> {
  if (!maxHourlyRate || maxHourlyRate <= 0) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  const key = `rate_limit:smtp:${smtpProfileId}`;
  const window = 60 * 60;
  const now = Date.now();
  const windowStart = Math.floor(now / 1000 / window) * window;

  const currentCount = await redis.get(`${key}:${windowStart}`);
  const count = currentCount ? parseInt(currentCount, 10) : 0;
  const remaining = Math.max(0, maxHourlyRate - count);
  const resetAt = new Date((windowStart + window) * 1000);

  return {
    allowed: count < maxHourlyRate,
    remaining,
    resetAt,
  };
}

/**
 * Reset rate limit for SMTP profile (for testing/admin)
 */
export async function resetRateLimit(smtpProfileId: string): Promise<void> {
  const pattern = `rate_limit:smtp:${smtpProfileId}:*`;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

