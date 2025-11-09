import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSMTPProfile, getSMTPProfiles, updateSMTPProfile, deleteSMTPProfile } from '@/app/actions/smtp';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createTestUser, createTestOrganization, createTestOrganizationMember, cleanupTestData } from '../../utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/auth/session');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(() => {}),
}));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    organizationMember: {
      findFirst: vi.fn(),
    },
    smtpProfile: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    campaign: {
      count: vi.fn(),
    },
  },
}));
vi.mock('@/lib/security/encryption', () => ({
  encrypt: vi.fn((text) => `encrypted-${text}`),
  decrypt: vi.fn((text) => text.replace('encrypted-', '')),
}));
vi.mock('@/lib/templates/language-columns', () => ({
  isLanguageActive: vi.fn().mockResolvedValue(true),
}));

describe('SMTP Actions', () => {
  let testUser: any;
  let testOrg: any;

  beforeEach(() => {
    // Don't use cleanupTestData here since we're mocking Prisma
    testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'OWNER',
    };
    testOrg = {
      id: 'test-org-id',
      name: 'Test Organization',
      defaultLanguage: 'en',
    };

    vi.mocked(getCurrentUser).mockResolvedValue(testUser as any);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      userId: testUser.id,
      organizationId: testOrg.id,
      organization: testOrg,
    } as any);
  });

  describe('createSMTPProfile', () => {
    it('should create a new SMTP profile', async () => {
      const profileData = {
        name: 'Test SMTP',
        host: 'smtp.example.com',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'TLS' as const,
        fromEmail: 'test@example.com',
        fromName: 'Test',
      };

      const createdProfile = {
        id: 'smtp-1',
        ...profileData,
        password: 'encrypted-password123',
        organizationId: testOrg.id,
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.smtpProfile.create).mockResolvedValue(createdProfile as any);

      const result = await createSMTPProfile(profileData);

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(prisma.smtpProfile.create).toHaveBeenCalled();
    });

    it('should encrypt password before saving', async () => {
      const { encrypt } = await import('@/lib/security/encryption');
      const profileData = {
        name: 'Test SMTP',
        host: 'smtp.example.com',
        port: 587,
        username: 'test@example.com',
        password: 'password123',
        encryption: 'TLS' as const,
        fromEmail: 'test@example.com',
      };

      vi.mocked(prisma.smtpProfile.create).mockResolvedValue({
        id: 'smtp-1',
        ...profileData,
      } as any);

      await createSMTPProfile(profileData);

      expect(encrypt).toHaveBeenCalledWith('password123');
    });
  });

  describe('getSMTPProfiles', () => {
    it('should fetch SMTP profiles for organization', async () => {
      const mockProfiles = [
        {
          id: 'smtp-1',
          name: 'Test SMTP',
          organizationId: testOrg.id,
          isActive: true,
        },
      ];

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.smtpProfile.findMany).mockResolvedValue(mockProfiles as any);

      const result = await getSMTPProfiles();

      expect(result.success).toBe(true);
      expect(result.profiles).toHaveLength(1);
      // Password should not be included
      expect(result.profiles[0]).not.toHaveProperty('password');
    });
  });

  describe('updateSMTPProfile', () => {
    it('should update an SMTP profile', async () => {
      const existingProfile = {
        id: 'smtp-1',
        organizationId: testOrg.id,
        name: 'Old Name',
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.smtpProfile.findFirst).mockResolvedValue(existingProfile as any);
      vi.mocked(prisma.smtpProfile.update).mockResolvedValue({
        ...existingProfile,
        name: 'New Name',
      } as any);

      const result = await updateSMTPProfile('smtp-1', {
        name: 'New Name',
      });

      expect(result.success).toBe(true);
      expect(prisma.smtpProfile.update).toHaveBeenCalled();
    });

    it('should return error if profile not found', async () => {
      vi.mocked(prisma.smtpProfile.findFirst).mockResolvedValue(null);

      const result = await updateSMTPProfile('smtp-1', {
        name: 'New Name',
      });

      expect(result.error).toBe('SMTP profile not found');
    });
  });

  describe('deleteSMTPProfile', () => {
    it('should delete an SMTP profile', async () => {
      const existingProfile = {
        id: 'smtp-1',
        organizationId: testOrg.id,
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
        role: 'OWNER',
      } as any);
      vi.mocked(prisma.smtpProfile.findFirst).mockResolvedValue({
        ...existingProfile,
        campaigns: [],
      } as any);
      vi.mocked(prisma.campaign.count).mockResolvedValue(0);
      vi.mocked(prisma.smtpProfile.delete).mockResolvedValue(existingProfile as any);

      const result = await deleteSMTPProfile('smtp-1');

      expect(result.success).toBe(true);
      expect(prisma.smtpProfile.delete).toHaveBeenCalled();
    });
  });
});

