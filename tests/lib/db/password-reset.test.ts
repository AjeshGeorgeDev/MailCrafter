/**
 * Tests for Password Reset Token Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateResetToken,
  createPasswordResetToken,
  getPasswordResetToken,
  markTokenAsUsed,
  deleteExpiredTokens,
} from '@/lib/db/password-reset';
import { prisma } from '@/lib/db/prisma';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    passwordResetToken: {
      deleteMany: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Password Reset Token Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateResetToken', () => {
    it('should generate a unique token', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThan(0);
    });

    it('should generate tokens of consistent length', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1.length).toBe(token2.length);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex characters
    });
  });

  describe('createPasswordResetToken', () => {
    it('should delete existing unused tokens before creating new one', async () => {
      const mockToken = 'new-token-123';
      const mockExpires = new Date();
      mockExpires.setHours(mockExpires.getHours() + 24);

      (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.passwordResetToken.create as any).mockResolvedValue({
        id: 'token-id',
        token: mockToken,
        userId: 'user-1',
        expires: mockExpires,
        used: false,
      });

      const token = await createPasswordResetToken('user-1');

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          used: false,
        },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(token).toBeDefined();
    });

    it('should create token with 24 hour expiry', async () => {
      const mockToken = 'new-token-123';
      const now = new Date();
      const expectedExpires = new Date(now);
      expectedExpires.setHours(expectedExpires.getHours() + 24);

      (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 0 });
      (prisma.passwordResetToken.create as any).mockImplementation((args: any) => {
        const expires = new Date(args.data.expires);
        expect(expires.getTime()).toBeCloseTo(expectedExpires.getTime(), -3); // Within 1 second
        return Promise.resolve({
          id: 'token-id',
          token: mockToken,
          userId: args.data.userId,
          expires: args.data.expires,
          used: false,
        });
      });

      await createPasswordResetToken('user-1');

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });
  });

  describe('getPasswordResetToken', () => {
    it('should return null for non-existent token', async () => {
      (prisma.passwordResetToken.findUnique as any).mockResolvedValue(null);

      const result = await getPasswordResetToken('non-existent-token');

      expect(result).toBeNull();
    });

    it('should return null and delete expired token', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 1); // 1 hour ago

      (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
        id: 'token-id',
        token: 'expired-token',
        userId: 'user-1',
        expires: expiredDate,
        used: false,
      });
      (prisma.passwordResetToken.delete as any).mockResolvedValue({});

      const result = await getPasswordResetToken('expired-token');

      expect(result).toBeNull();
      expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      });
    });

    it('should return null for already used token', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
        id: 'token-id',
        token: 'used-token',
        userId: 'user-1',
        expires: futureDate,
        used: true,
      });

      const result = await getPasswordResetToken('used-token');

      expect(result).toBeNull();
    });

    it('should return userId for valid token', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
        id: 'token-id',
        token: 'valid-token',
        userId: 'user-1',
        expires: futureDate,
        used: false,
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      });

      const result = await getPasswordResetToken('valid-token');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-1');
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark token as used', async () => {
      (prisma.passwordResetToken.update as any).mockResolvedValue({
        id: 'token-id',
        token: 'token-123',
        used: true,
      });

      await markTokenAsUsed('token-123');

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { token: 'token-123' },
        data: { used: true },
      });
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 5 });

      const count = await deleteExpiredTokens();

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expires: {
            lt: expect.any(Date),
          },
        },
      });
      expect(count).toBe(5);
    });

    it('should return 0 if no expired tokens', async () => {
      (prisma.passwordResetToken.deleteMany as any).mockResolvedValue({ count: 0 });

      const count = await deleteExpiredTokens();

      expect(count).toBe(0);
    });
  });
});

