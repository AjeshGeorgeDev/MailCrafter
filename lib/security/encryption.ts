/**
 * Encryption Utility
 * AES-256-GCM encryption for sensitive data (SMTP passwords, etc.)
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Falls back to a default key in development (NOT for production)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    // Development fallback - warn but allow
    console.warn("⚠️  ENCRYPTION_KEY not set. Using default key for development only!");
    return crypto.scryptSync("default-dev-key-change-in-production", "salt", KEY_LENGTH);
  }
  
  // Use the key directly if it's 64 hex characters (32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }
  
  // Otherwise derive key from the string using scrypt
  return crypto.scryptSync(key, "mailcrafter-salt", KEY_LENGTH);
}

/**
 * Encrypt text using AES-256-GCM
 * Returns format: iv:tag:encryptedData (all base64 encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    return "";
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();

  // Return format: iv:tag:encryptedData (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt encrypted data
 * Expects format: iv:tag:encryptedData (all base64 encoded)
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return "";
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const [ivBase64, tagBase64, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data. Data may be corrupted or key may be incorrect.");
  }
}

/**
 * Check if a string is encrypted (has the expected format)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  const parts = data.split(":");
  return parts.length === 3;
}

