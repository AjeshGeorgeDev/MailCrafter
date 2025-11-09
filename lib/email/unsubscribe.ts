/**
 * Unsubscribe Utilities
 * Generate unsubscribe tokens and URLs
 */

import { encrypt } from "@/lib/security/encryption";

export interface UnsubscribeTokenData {
  email: string;
  campaignId?: string;
  timestamp: number;
}

/**
 * Generate unsubscribe token
 */
export function generateUnsubscribeToken(
  email: string,
  campaignId?: string
): string {
  const data: UnsubscribeTokenData = {
    email,
    campaignId,
    timestamp: Date.now(),
  };

  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt unsubscribe token
 */
export function decryptUnsubscribeToken(token: string): UnsubscribeTokenData | null {
  try {
    const { decrypt } = require("@/lib/security/encryption");
    const decrypted = decrypt(token);
    const data = JSON.parse(decrypted) as UnsubscribeTokenData;
    
    // Check if token is expired (30 days)
    const tokenAge = Date.now() - data.timestamp;
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (tokenAge > maxAge) {
      return null; // Token expired
    }
    
    return data;
  } catch (error) {
    console.error("Decrypt unsubscribe token error:", error);
    return null;
  }
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(
  email: string,
  campaignId?: string,
  baseUrl?: string
): string {
  const token = generateUnsubscribeToken(email, campaignId);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/unsubscribe/${token}`;
}

/**
 * Generate preference center URL
 */
export function generatePreferenceCenterUrl(
  email: string,
  baseUrl?: string
): string {
  const token = generateUnsubscribeToken(email);
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/preferences/${token}`;
}

