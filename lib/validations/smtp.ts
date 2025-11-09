/**
 * SMTP Profile Validation Schemas
 */

import { z } from "zod";

/**
 * SMTP Encryption Type
 */
export const smtpEncryptionSchema = z.enum(["TLS", "SSL", "NONE"]);

/**
 * Host validation - domain or IP address
 */
const hostSchema = z
  .string()
  .min(1, "Host is required")
  .max(255, "Host must be less than 255 characters")
  .refine(
    (val) => {
      // Domain validation (e.g., smtp.gmail.com)
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      // IP address validation (IPv4)
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      // IPv6 validation (simplified)
      const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
      
      return domainRegex.test(val) || ipv4Regex.test(val) || ipv6Regex.test(val);
    },
    {
      message: "Host must be a valid domain name or IP address",
    }
  );

/**
 * Port validation (1-65535)
 */
const portSchema = z
  .number()
  .int("Port must be an integer")
  .min(1, "Port must be between 1 and 65535")
  .max(65535, "Port must be between 1 and 65535");

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

/**
 * Create SMTP Profile Schema
 */
export const createSMTPProfileSchema = z.object({
  name: z.string().min(1, "Profile name is required").max(100, "Name must be less than 100 characters"),
  host: hostSchema,
  port: portSchema,
  username: z.string().min(1, "Username is required").max(255, "Username must be less than 255 characters"),
  password: z.string().min(1, "Password is required"),
  encryption: smtpEncryptionSchema.default("TLS"),
  fromEmail: emailSchema,
  fromName: z.string().max(100, "From name must be less than 100 characters").optional(),
  replyTo: emailSchema.optional(),
  maxHourlyRate: z.number().int().min(1).max(1000000).optional(),
  isDefault: z.boolean().default(false),
});

/**
 * Update SMTP Profile Schema
 * All fields optional except password handling
 */
export const updateSMTPProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  host: hostSchema.optional(),
  port: portSchema.optional(),
  username: z.string().min(1).max(255).optional(),
  password: z.string().min(1).optional(), // Optional - if not provided, keep existing
  encryption: smtpEncryptionSchema.optional(),
  fromEmail: emailSchema.optional(),
  fromName: z.string().max(100).optional(),
  replyTo: emailSchema.optional().nullable(),
  maxHourlyRate: z.number().int().min(1).max(1000000).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

/**
 * SMTP Configuration for testing (without profile ID)
 */
export const smtpConfigSchema = z.object({
  host: hostSchema,
  port: portSchema,
  username: z.string().min(1),
  password: z.string().min(1),
  encryption: smtpEncryptionSchema,
  fromEmail: emailSchema,
});

export type CreateSMTPProfileInput = z.infer<typeof createSMTPProfileSchema>;
export type UpdateSMTPProfileInput = z.infer<typeof updateSMTPProfileSchema>;
export type SMTPConfig = z.infer<typeof smtpConfigSchema>;

