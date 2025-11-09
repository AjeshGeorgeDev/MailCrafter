import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOrganization, updateOrganization } from '@/app/actions/organizations';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createTestUser, createTestOrganization, createTestOrganizationMember, cleanupTestData } from '../../utils/test-helpers';

// Mock dependencies
vi.mock('@/lib/auth/session');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(() => {}),
}));
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(null),
  }),
}));
vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn(), // Mock to allow all permissions in tests
}));
vi.mock('@/lib/audit/audit-logger', () => ({
  logAuditAction: vi.fn(),
}));
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    organizationMember: {
      findFirst: vi.fn(),
    },
    organization: {
      update: vi.fn(),
    },
  },
}));

describe('Organization Actions', () => {
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
  });

  describe('getOrganization', () => {
    it('should return organization for authenticated user', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);

      const result = await getOrganization();

      expect(result.success).toBe(true);
      expect(result.organization).toBeDefined();
      expect(result.organization.id).toBe(testOrg.id);
    });

    it('should return error if user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await getOrganization();

      expect(result.error).toBe('Unauthorized');
    });

    it('should return error if user is not part of an organization', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue(null);

      const result = await getOrganization();

      expect(result.error).toBe('User is not part of an organization');
    });
  });

  describe('updateOrganization', () => {
    it('should update organization name', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        ...testOrg,
        name: 'Updated Name',
      } as any);

      const result = await updateOrganization({
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: testOrg.id },
        data: { name: 'Updated Name' },
      });
    });

    it('should update default language', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.organization.update).mockResolvedValue({
        ...testOrg,
        defaultLanguage: 'fr',
      } as any);

      const result = await updateOrganization({
        defaultLanguage: 'fr',
      });

      expect(result.success).toBe(true);
      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: testOrg.id },
        data: { defaultLanguage: 'fr' },
      });
    });
  });
});

