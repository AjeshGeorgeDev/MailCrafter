import { describe, it, expect } from 'vitest';
import { smtpConfigSchema } from '@/lib/validations/smtp';

describe('SMTP Validation Schema', () => {
  describe('smtpConfigSchema', () => {
    it('should validate correct SMTP config', () => {
      const validConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        encryption: 'TLS',
        fromEmail: 'sender@example.com',
      };

      const result = smtpConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid host', () => {
      const invalidConfig = {
        host: '',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        encryption: 'TLS',
        fromEmail: 'sender@example.com',
      };

      const result = smtpConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid port', () => {
      const invalidConfig = {
        host: 'smtp.example.com',
        port: 0,
        username: 'user@example.com',
        password: 'password123',
        encryption: 'TLS',
        fromEmail: 'sender@example.com',
      };

      const result = smtpConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidConfig = {
        host: 'smtp.example.com',
        port: 587,
        username: 'user@example.com',
        password: 'password123',
        encryption: 'TLS',
        fromEmail: 'invalid-email',
      };

      const result = smtpConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should accept valid encryption types', () => {
      const encryptionTypes = ['TLS', 'SSL', 'NONE'];
      
      encryptionTypes.forEach((encryption) => {
        const config = {
          host: 'smtp.example.com',
          port: 587,
          username: 'user@example.com',
          password: 'password123',
          encryption,
          fromEmail: 'sender@example.com',
        };

        const result = smtpConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });
  });
});

