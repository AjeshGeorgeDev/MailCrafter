/**
 * Tests for Password Reset Functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestPasswordReset, resetPassword } from '@/app/actions/auth';
import { createPasswordResetToken, getPasswordResetToken, markTokenAsUsed } from '@/lib/db/password-reset';
import { getUserByEmail, updateUser } from '@/lib/db/users';
import { sendEmail } from '@/lib/email/email-service';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { prisma } from '@/lib/db/prisma';

// Mock dependencies
vi.mock('@/lib/db/users');
vi.mock('@/lib/db/password-reset');
vi.mock('@/lib/email/email-service');
vi.mock('@/lib/auth/password');
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    smtpProfile: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Password Reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should return error for invalid email', async () => {
      const result = await requestPasswordReset('invalid-email');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid email');
      expect(result.success).toBeUndefined();
    });

    it('should return success even if user does not exist (security)', async () => {
      (getUserByEmail as any).mockResolvedValue(null);

      const result = await requestPasswordReset('nonexistent@example.com');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account with that email exists');
      expect(getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(createPasswordResetToken).not.toHaveBeenCalled();
    });

    it('should return error if no SMTP profile is configured', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      };

      (getUserByEmail as any).mockResolvedValue(mockUser);
      (prisma.smtpProfile.findFirst as any).mockResolvedValue(null);

      const result = await requestPasswordReset('user@example.com');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Email service is not configured');
    });

    it('should create token and send email for valid user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
      };

      const mockSMTPProfile = {
        id: 'smtp-1',
        fromEmail: 'noreply@mailcrafter.com',
        fromName: 'MailCrafter',
      };

      (getUserByEmail as any).mockResolvedValue(mockUser);
      (prisma.smtpProfile.findFirst as any).mockResolvedValue(mockSMTPProfile);
      (createPasswordResetToken as any).mockResolvedValue('reset-token-123');
      (sendEmail as any).mockResolvedValue('message-id-123');

      const result = await requestPasswordReset('user@example.com');
      
      expect(result.success).toBe(true);
      expect(createPasswordResetToken).toHaveBeenCalledWith('user-1');
      expect(sendEmail).toHaveBeenCalled();
      
      const emailCall = (sendEmail as any).mock.calls[0][0];
      expect(emailCall.to).toBe('user@example.com');
      expect(emailCall.subject).toContain('Reset Your');
      expect(emailCall.subject).toContain('Password');
      expect(emailCall.html).toContain('reset-password?token=reset-token-123');
    });

    it('should handle errors gracefully', async () => {
      (getUserByEmail as any).mockRejectedValue(new Error('Database error'));

      const result = await requestPasswordReset('user@example.com');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('error occurred');
    });
  });

  describe('resetPassword', () => {
    it('should return error for missing token', async () => {
      const result = await resetPassword('', 'newpassword123', 'newpassword123');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Token is required');
    });

    it('should return error for password mismatch', async () => {
      const result = await resetPassword('token-123', 'password123', 'password456');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Passwords don't match");
    });

    it('should return error for weak password', async () => {
      (validatePasswordStrength as any).mockReturnValue({
        valid: false,
        errors: ['Password must be at least 8 characters'],
      });

      const result = await resetPassword('token-123', 'short', 'short');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Password must be at least 8 characters');
    });

    it('should return error for invalid or expired token', async () => {
      (getPasswordResetToken as any).mockResolvedValue(null);
      (validatePasswordStrength as any).mockReturnValue({
        valid: true,
        errors: [],
      });

      const result = await resetPassword('invalid-token', 'newpassword123', 'newpassword123');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid or expired reset token');
    });

    it('should successfully reset password with valid token', async () => {
      const mockTokenData = {
        userId: 'user-1',
      };

      (getPasswordResetToken as any).mockResolvedValue(mockTokenData);
      (hashPassword as any).mockResolvedValue('hashed-password');
      (updateUser as any).mockResolvedValue({ id: 'user-1' });
      (markTokenAsUsed as any).mockResolvedValue(undefined);
      (validatePasswordStrength as any).mockReturnValue({
        valid: true,
        errors: [],
      });

      const result = await resetPassword('valid-token', 'newpassword123', 'newpassword123');
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Password has been reset successfully');
      expect(hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(updateUser).toHaveBeenCalledWith('user-1', {
        password: 'hashed-password',
      });
      expect(markTokenAsUsed).toHaveBeenCalledWith('valid-token');
    });

    it('should not allow reusing a token', async () => {
      // First reset
      const mockTokenData = {
        userId: 'user-1',
      };

      (getPasswordResetToken as any).mockResolvedValueOnce(mockTokenData);
      (hashPassword as any).mockResolvedValue('hashed-password');
      (updateUser as any).mockResolvedValue({ id: 'user-1' });
      (markTokenAsUsed as any).mockResolvedValue(undefined);
      (validatePasswordStrength as any).mockReturnValue({
        valid: true,
        errors: [],
      });

      await resetPassword('valid-token', 'newpassword123', 'newpassword123');

      // Try to use same token again
      (getPasswordResetToken as any).mockResolvedValueOnce(null);

      const result = await resetPassword('valid-token', 'anotherpassword123', 'anotherpassword123');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid or expired reset token');
    });

    it('should handle errors gracefully', async () => {
      (getPasswordResetToken as any).mockRejectedValue(new Error('Database error'));

      const result = await resetPassword('token-123', 'newpassword123', 'newpassword123');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('error occurred');
    });
  });
});

