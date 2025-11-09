import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCampaign, getCampaigns, getCampaignById } from '@/app/actions/campaigns';
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
    campaign: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    template: {
      findFirst: vi.fn(),
    },
    smtpProfile: {
      findFirst: vi.fn(),
    },
  },
}));

describe('Campaign Actions', () => {
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

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Test Campaign',
        subject: 'Test Subject',
        templateId: 'template-1',
        recipientCount: 100,
      };

      const createdCampaign = {
        id: 'campaign-1',
        ...campaignData,
        organizationId: testOrg.id,
        createdBy: testUser.id,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
        role: 'OWNER',
      } as any);
      vi.mocked(prisma.template.findFirst).mockResolvedValue({
        id: 'template-1',
        organizationId: testOrg.id,
      } as any);
      vi.mocked(prisma.smtpProfile.findFirst).mockResolvedValue({
        id: 'smtp-1',
        isDefault: true,
        isActive: true,
      } as any);
      vi.mocked(prisma.campaign.create).mockResolvedValue(createdCampaign as any);

      const result = await createCampaign(campaignData);

      expect(result.success).toBe(true);
      expect(result.campaign).toBeDefined();
      expect(prisma.campaign.create).toHaveBeenCalled();
    });

    it('should return error if template not found', async () => {
      vi.mocked(prisma.template.findFirst).mockResolvedValue(null);

      const result = await createCampaign({
        name: 'Test Campaign',
        subject: 'Test Subject',
        templateId: 'template-1',
        recipientCount: 100,
      });

      expect(result.error).toBe('Template not found');
    });
  });

  describe('getCampaigns', () => {
    it('should fetch campaigns for organization', async () => {
      const mockCampaigns = [
        {
          id: 'campaign-1',
          name: 'Test Campaign',
          organizationId: testOrg.id,
          status: 'DRAFT',
        },
      ];

      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns as any);
      vi.mocked(prisma.campaign.count).mockResolvedValue(1);

      const result = await getCampaigns({});

      expect(result.campaigns).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter campaigns by status', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);
      vi.mocked(prisma.campaign.count).mockResolvedValue(0);

      await getCampaigns({ status: 'COMPLETED' });

      expect(prisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'COMPLETED',
          }),
        })
      );
    });
  });

  describe('getCampaignById', () => {
    it('should return campaign by id', async () => {
      const campaign = {
        id: 'campaign-1',
        name: 'Test Campaign',
        organizationId: testOrg.id,
      };

      vi.mocked(prisma.campaign.findFirst).mockResolvedValue(campaign as any);

      const result = await getCampaignById('campaign-1');

      expect(result.success).toBe(true);
      expect(result.campaign).toBeDefined();
    });

    it('should return error if campaign not found', async () => {
      vi.mocked(prisma.campaign.findFirst).mockResolvedValue(null);

      const result = await getCampaignById('campaign-1');

      expect(result.error).toBe('Campaign not found');
    });
  });
});

