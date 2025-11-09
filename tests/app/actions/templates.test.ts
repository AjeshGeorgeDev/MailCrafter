import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTemplate, saveTemplate, getTemplateById } from '@/app/actions/templates';
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
    template: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    templateVersion: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));
vi.mock('@/lib/templates/template-language-helpers', () => ({
  saveTemplateLanguage: vi.fn(),
  getAllTemplateLanguages: vi.fn(),
  getTemplateLanguage: vi.fn(),
}));
vi.mock('@/lib/templates/language-columns', () => ({
  isLanguageActive: vi.fn().mockResolvedValue(true),
}));

describe('Template Actions', () => {
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

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'Test Description',
        structure: { childrenIds: [] },
        defaultLanguage: 'en',
      };

      const createdTemplate = {
        id: 'template-1',
        ...templateData,
        organizationId: testOrg.id,
        createdBy: testUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      const { getAllTemplateLanguages } = await import('@/lib/templates/template-language-helpers');
      vi.mocked(getAllTemplateLanguages).mockResolvedValue({ en: templateData.structure } as any);
      vi.mocked(prisma.template.create).mockResolvedValue(createdTemplate as any);
      vi.mocked(prisma.templateVersion.create).mockResolvedValue({} as any);

      const result = await createTemplate(templateData);

      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
      expect(prisma.template.create).toHaveBeenCalled();
    });

    it('should return error if user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await createTemplate({
        name: 'Test Template',
        defaultLanguage: 'en',
      });

      expect(result.error).toBe('Unauthorized');
    });

    it('should return error if default language is not active', async () => {
      const { isLanguageActive } = await import('@/lib/templates/language-columns');
      vi.mocked(isLanguageActive).mockResolvedValue(false);

      const result = await createTemplate({
        name: 'Test Template',
        defaultLanguage: 'fr',
      });

      expect(result.error).toContain('not enabled');
    });
  });

  describe('saveTemplate', () => {
    it('should save template structure', async () => {
      const template = {
        id: 'template-1',
        organizationId: testOrg.id,
      };

      const structure = {
        childrenIds: ['block-1'],
        'block-1': { type: 'Container', data: {} },
      };

      const { isLanguageActive } = await import('@/lib/templates/language-columns');
      vi.mocked(isLanguageActive).mockResolvedValue(true);
      
      vi.mocked(prisma.template.findFirst).mockResolvedValue(template as any);
      vi.mocked(prisma.template.update).mockResolvedValue({
        ...template,
        updatedAt: new Date(),
      } as any);
      vi.mocked(prisma.templateVersion.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.templateVersion.create).mockResolvedValue({} as any);

      const { saveTemplateLanguage, getTemplateLanguage, getAllTemplateLanguages } = await import('@/lib/templates/template-language-helpers');
      vi.mocked(getTemplateLanguage).mockResolvedValue(null);
      vi.mocked(getAllTemplateLanguages).mockResolvedValue({ en: structure } as any);
      vi.mocked(saveTemplateLanguage).mockResolvedValue(undefined);

      const result = await saveTemplate('template-1', structure, 'en');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(saveTemplateLanguage).toHaveBeenCalled();
    });

    it('should return error if template not found', async () => {
      const { isLanguageActive } = await import('@/lib/templates/language-columns');
      vi.mocked(isLanguageActive).mockResolvedValue(true);
      vi.mocked(prisma.template.findFirst).mockResolvedValue(null);

      const result = await saveTemplate('template-1', {}, 'en');

      expect(result.error).toBe('Template not found or access denied');
    });
  });

  describe('getTemplateById', () => {
    it('should return template by id', async () => {
      const template = {
        id: 'template-1',
        name: 'Test Template',
        organizationId: testOrg.id,
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.template.findFirst).mockResolvedValue(template as any);

      const result = await getTemplateById('template-1');

      expect(result.success).toBe(true);
      expect(result.template).toBeDefined();
    });

    it('should return error if template not found', async () => {
      vi.mocked(prisma.template.findFirst).mockResolvedValue(null);

      const result = await getTemplateById('template-1');

      expect(result.error).toBe('Template not found or access denied');
    });
  });
});

