import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createApiKey,
  getApiKeys,
  updateApiKey,
  revokeApiKey,
  validateApiKey,
} from '@/app/actions/api-keys';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { generateApiKey, hashApiKey, verifyApiKey } from '@/lib/auth/api-keys';
import { revalidatePath } from 'next/cache';

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
    aPIKey: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock('@/lib/auth/api-keys', () => ({
  generateApiKey: vi.fn(),
  hashApiKey: vi.fn(),
  verifyApiKey: vi.fn(),
}));

describe('API Key Actions', () => {
  let testUser: any;
  let testOrg: any;
  let testApiKey: string;
  let testKeyHash: string;

  beforeEach(() => {
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
    testApiKey = 'mc_test123456789012345678901234567890';
    testKeyHash = 'hashed_key_value';

    vi.mocked(getCurrentUser).mockResolvedValue(testUser as any);
    vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
      userId: testUser.id,
      organizationId: testOrg.id,
      organization: testOrg,
      role: 'OWNER',
    } as any);
    vi.mocked(generateApiKey).mockReturnValue(testApiKey);
    vi.mocked(hashApiKey).mockResolvedValue(testKeyHash);
    vi.mocked(revalidatePath).mockClear();
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      const apiKeyData = {
        name: 'Test API Key',
        permissions: ['emails.send', 'templates.read'],
        expiresAt: null,
      };

      const createdKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        name: apiKeyData.name,
        keyHash: testKeyHash,
        permissions: apiKeyData.permissions,
        createdAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(prisma.aPIKey.create).mockResolvedValue(createdKey as any);

      const result = await createApiKey(apiKeyData);

      expect(result.success).toBe(true);
      expect(result.apiKey).toBeDefined();
      expect(result.apiKey?.name).toBe(apiKeyData.name);
      expect(result.apiKey?.key).toBe(testApiKey);
      expect(prisma.aPIKey.create).toHaveBeenCalledWith({
        data: {
          organizationId: testOrg.id,
          name: apiKeyData.name,
          keyHash: testKeyHash,
          permissions: apiKeyData.permissions,
          expiresAt: null,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings/api-keys');
    });

    it('should create API key with expiration date', async () => {
      const expiresAt = new Date('2025-12-31T23:59:59');
      const apiKeyData = {
        name: 'Test API Key',
        permissions: [],
        expiresAt: expiresAt.toISOString(),
      };

      const createdKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        name: apiKeyData.name,
        keyHash: testKeyHash,
        permissions: [],
        createdAt: new Date(),
        expiresAt,
      };

      vi.mocked(prisma.aPIKey.create).mockResolvedValue(createdKey as any);

      const result = await createApiKey(apiKeyData);

      expect(result.success).toBe(true);
      expect(prisma.aPIKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });

    it('should return error if user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await createApiKey({
        name: 'Test Key',
        permissions: [],
        expiresAt: null,
      });

      expect(result.error).toBe('Unauthorized');
    });

    it('should return error if user is not part of organization', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue(null);

      const result = await createApiKey({
        name: 'Test Key',
        permissions: [],
        expiresAt: null,
      });

      expect(result.error).toBe('User is not part of an organization');
    });

    it('should return error for invalid input', async () => {
      const result = await createApiKey({
        name: '', // Invalid: empty name
        permissions: [],
        expiresAt: null,
      });

      expect(result.error).toBeDefined();
      expect(result.success).toBeUndefined();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('getApiKeys', () => {
    it('should fetch all API keys for organization', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Key 1',
          permissions: ['emails.send'],
          lastUsedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          expiresAt: null,
        },
        {
          id: 'key-2',
          name: 'Key 2',
          permissions: ['templates.read'],
          lastUsedAt: null,
          createdAt: new Date('2024-01-02'),
          expiresAt: new Date('2025-12-31'),
        },
      ];

      vi.mocked(prisma.aPIKey.findMany).mockResolvedValue(mockKeys as any);

      const result = await getApiKeys();

      expect(result.success).toBe(true);
      expect(result.apiKeys).toHaveLength(2);
      expect(result.apiKeys?.[0].name).toBe('Key 1');
      expect(result.apiKeys?.[1].isExpired).toBe(false);
      expect(prisma.aPIKey.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: testOrg.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should mark expired keys correctly', async () => {
      const pastDate = new Date('2020-01-01');
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Expired Key',
          permissions: [],
          lastUsedAt: null,
          createdAt: new Date('2020-01-01'),
          expiresAt: pastDate,
        },
      ];

      vi.mocked(prisma.aPIKey.findMany).mockResolvedValue(mockKeys as any);

      const result = await getApiKeys();

      expect(result.success).toBe(true);
      expect(result.apiKeys?.[0].isExpired).toBe(true);
    });

    it('should return error if user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await getApiKeys();

      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('updateApiKey', () => {
    it('should update API key name', async () => {
      const existingKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        name: 'Old Name',
        keyHash: testKeyHash,
        permissions: [],
        createdAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(existingKey as any);
      vi.mocked(prisma.aPIKey.update).mockResolvedValue({
        ...existingKey,
        name: 'New Name',
      } as any);

      const result = await updateApiKey('key-1', { name: 'New Name' });

      expect(result.success).toBe(true);
      expect(prisma.aPIKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { name: 'New Name' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings/api-keys');
    });

    it('should update API key permissions', async () => {
      const existingKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        name: 'Test Key',
        keyHash: testKeyHash,
        permissions: ['emails.send'],
        createdAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(existingKey as any);
      vi.mocked(prisma.aPIKey.update).mockResolvedValue({
        ...existingKey,
        permissions: ['templates.read'],
      } as any);

      const result = await updateApiKey('key-1', {
        permissions: ['templates.read'],
      });

      expect(result.success).toBe(true);
      expect(prisma.aPIKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { permissions: ['templates.read'] },
      });
    });

    it('should return error if API key not found', async () => {
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(null);

      const result = await updateApiKey('key-1', { name: 'New Name' });

      expect(result.error).toBe('API key not found');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const existingKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        name: 'Test Key',
        keyHash: testKeyHash,
        permissions: [],
        createdAt: new Date(),
        expiresAt: null,
      };

      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(existingKey as any);
      vi.mocked(prisma.aPIKey.delete).mockResolvedValue(existingKey as any);

      const result = await revokeApiKey('key-1');

      expect(result.success).toBe(true);
      expect(prisma.aPIKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings/api-keys');
    });

    it('should return error if API key not found', async () => {
      vi.mocked(prisma.aPIKey.findFirst).mockResolvedValue(null);

      const result = await revokeApiKey('key-1');

      expect(result.error).toBe('API key not found');
    });
  });

  describe('validateApiKey', () => {
    it('should validate a correct API key', async () => {
      const apiKey = 'mc_validkey123456789012345678901234';
      const mockKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        keyHash: testKeyHash,
        permissions: ['emails.send'],
        expiresAt: null,
      };

      vi.mocked(prisma.aPIKey.findMany).mockResolvedValue([mockKey] as any);
      vi.mocked(verifyApiKey).mockResolvedValue(true);
      vi.mocked(prisma.aPIKey.update).mockResolvedValue(mockKey as any);

      const result = await validateApiKey(apiKey);

      expect(result.success).toBe(true);
      expect(result.organizationId).toBe(testOrg.id);
      expect(result.permissions).toEqual(['emails.send']);
      expect(prisma.aPIKey.update).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should reject invalid API key format', async () => {
      const result = await validateApiKey('invalid_key');

      expect(result.error).toBe('Invalid API key format');
    });

    it('should reject expired API key', async () => {
      const apiKey = 'mc_validkey123456789012345678901234';
      const expiredDate = new Date('2020-01-01');
      const mockKey = {
        id: 'key-1',
        organizationId: testOrg.id,
        keyHash: testKeyHash,
        permissions: [],
        expiresAt: expiredDate,
      };

      vi.mocked(prisma.aPIKey.findMany).mockResolvedValue([mockKey] as any);
      vi.mocked(verifyApiKey).mockResolvedValue(true);

      const result = await validateApiKey(apiKey);

      expect(result.error).toBe('API key has expired');
    });

    it('should reject invalid API key', async () => {
      const apiKey = 'mc_validkey123456789012345678901234';

      vi.mocked(prisma.aPIKey.findMany).mockResolvedValue([]);
      vi.mocked(verifyApiKey).mockResolvedValue(false);

      const result = await validateApiKey(apiKey);

      expect(result.error).toBe('Invalid API key');
    });
  });
});

