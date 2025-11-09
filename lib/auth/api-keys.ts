/**
 * API Key Utilities
 * Functions for generating, hashing, and validating API keys
 */

import crypto from "crypto";
import { hashPassword, comparePassword } from "./password";

const API_KEY_PREFIX = "mc_";
const API_KEY_LENGTH = 32; // Random part length

/**
 * Generate a new API key
 * Format: mc_<random_32_chars>
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const randomPart = randomBytes.toString("base64url").slice(0, API_KEY_LENGTH);
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash an API key for storage
 * Uses the same password hashing function for consistency
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return hashPassword(apiKey);
}

/**
 * Verify an API key against a hash
 */
export async function verifyApiKey(
  apiKey: string,
  hash: string
): Promise<boolean> {
  return comparePassword(apiKey, hash);
}

/**
 * Mask an API key for display
 * Shows only first 8 characters and last 4 characters
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "mc_****";
  }
  const prefix = apiKey.slice(0, 8);
  const suffix = apiKey.slice(-4);
  return `${prefix}${"*".repeat(apiKey.length - 12)}${suffix}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return apiKey.startsWith(API_KEY_PREFIX) && apiKey.length >= 20;
}

