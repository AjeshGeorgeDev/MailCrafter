/**
 * Email Sending Service
 * Abstraction layer for sending emails via SMTP profiles
 */

import nodemailer from "nodemailer";
import type { Transporter, SendMailOptions } from "nodemailer";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";

export interface Attachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
  encoding?: string;
}

export interface EmailOptions {
  smtpProfileId: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string; // Override profile default
  fromName?: string; // Override profile default
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Attachment[];
  headers?: Record<string, string>;
}

// Transporter cache with TTL
interface CachedTransporter {
  transporter: Transporter;
  expiresAt: number;
}

const transporterCache = new Map<string, CachedTransporter>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired transporters from cache
 */
function clearExpiredTransporters() {
  const now = Date.now();
  for (const [key, cached] of transporterCache.entries()) {
    if (cached.expiresAt < now) {
      transporterCache.delete(key);
    }
  }
}

/**
 * Get or create SMTP transporter
 * Uses caching to avoid recreating transporters on every send
 */
export async function getSMTPTransporter(profileId: string): Promise<Transporter> {
  // Clear expired entries
  clearExpiredTransporters();

  // Check cache
  const cached = transporterCache.get(profileId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.transporter;
  }

  // Load profile from database
  const profile = await prisma.smtpProfile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error(`SMTP profile not found: ${profileId}`);
  }

  if (!profile.isActive) {
    throw new Error(`SMTP profile is inactive: ${profileId}`);
  }

  // Decrypt password
  const decryptedPassword = decrypt(profile.password);

  // Build transporter configuration
  const transporterConfig: any = {
    host: profile.host,
    port: profile.port,
    secure: profile.encryption === "SSL", // SSL uses secure: true
    auth: {
      user: profile.username,
      pass: decryptedPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  };

  // For TLS, we need to set requireTLS
  if (profile.encryption === "TLS") {
    transporterConfig.requireTLS = true;
    transporterConfig.secure = false; // TLS uses secure: false
  }

  // For NONE, disable security
  if (profile.encryption === "NONE") {
    transporterConfig.secure = false;
    transporterConfig.requireTLS = false;
    transporterConfig.ignoreTLS = true;
  }

  // Create transporter
  const transporter = nodemailer.createTransport(transporterConfig);

  // Cache transporter
  transporterCache.set(profileId, {
    transporter,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return transporter;
}

/**
 * Build email message object
 */
export function buildEmailMessage(options: EmailOptions): SendMailOptions {
  const message: SendMailOptions = {
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  // Set from address
  if (options.from) {
    message.from = options.fromName
      ? `"${options.fromName}" <${options.from}>`
      : options.from;
  }

  // Set reply-to
  if (options.replyTo) {
    message.replyTo = options.replyTo;
  }

  // Set CC
  if (options.cc && options.cc.length > 0) {
    message.cc = options.cc.join(", ");
  }

  // Set BCC
  if (options.bcc && options.bcc.length > 0) {
    message.bcc = options.bcc.join(", ");
  }

  // Add attachments
  if (options.attachments && options.attachments.length > 0) {
    message.attachments = options.attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      path: att.path,
      contentType: att.contentType,
      encoding: att.encoding,
    }));
  }

  // Add headers
  message.headers = {
    "X-Mailer": "MailCrafter",
    "Date": new Date().toUTCString(),
    ...options.headers,
  };

  // Add unsubscribe headers if unsubscribe URL is provided
  if (options.headers?.unsubscribeUrl) {
    message.headers["List-Unsubscribe"] = `<${options.headers.unsubscribeUrl}>`;
    message.headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  // Generate Message-ID if not provided
  if (!message.headers["Message-ID"]) {
    const domain = options.from?.split("@")[1] || "mailcrafter.local";
    message.headers["Message-ID"] = `<${Date.now()}-${Math.random().toString(36).substring(7)}@${domain}>`;
  }

  return message;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
  try {
    // Get transporter
    const transporter = await getSMTPTransporter(options.smtpProfileId);

    // Load profile to get default from email/name
    const profile = await prisma.smtpProfile.findUnique({
      where: { id: options.smtpProfileId },
      select: {
        fromEmail: true,
        fromName: true,
        replyTo: true,
      },
    });

    if (!profile) {
      throw new Error(`SMTP profile not found: ${options.smtpProfileId}`);
    }

    // Build message with profile defaults
    const messageOptions: EmailOptions = {
      ...options,
      from: options.from || profile.fromEmail,
      fromName: options.fromName || profile.fromName || undefined,
      replyTo: options.replyTo || profile.replyTo || undefined,
    };

    const message = buildEmailMessage(messageOptions);

    // Send email
    const info = await transporter.sendMail(message);

    if (!info.messageId) {
      throw new Error("Failed to send email: No message ID returned");
    }

    return info.messageId;
  } catch (error) {
    console.error("Send email error:", error);
    
    // Clear transporter from cache on error (might be invalid)
    transporterCache.delete(options.smtpProfileId);
    
    if (error instanceof Error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    throw new Error("Failed to send email: Unknown error");
  }
}

/**
 * Verify SMTP profile connection
 * Useful for testing before sending
 */
export async function verifySMTPProfile(profileId: string): Promise<boolean> {
  try {
    const transporter = await getSMTPTransporter(profileId);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Verify SMTP profile error:", error);
    // Clear transporter from cache on error
    transporterCache.delete(profileId);
    return false;
  }
}

/**
 * Clear transporter cache
 * Useful for forcing reconnection
 */
export function clearTransporterCache(profileId?: string) {
  if (profileId) {
    transporterCache.delete(profileId);
  } else {
    transporterCache.clear();
  }
}

