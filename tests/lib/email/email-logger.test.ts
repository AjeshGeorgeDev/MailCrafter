import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEmailLog, getEmailLogs, getEmailStatistics } from '@/lib/email/email-logger';
import { prisma } from '@/lib/db/prisma';
import { EmailStatus } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    emailLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    emailEvent: {
      create: vi.fn(),
      count: vi.fn(),
    },
    template: {
      findMany: vi.fn(),
    },
  },
}));

describe('Email Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEmailLog', () => {
    it('should create an email log entry', async () => {
      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        languageCode: 'en',
        variables: { name: 'Test' },
      };

      const createdLog = {
        id: 'log-1',
        ...emailData,
        status: 'QUEUED' as EmailStatus,
        createdAt: new Date(),
      };

      vi.mocked(prisma.emailLog.create).mockResolvedValue(createdLog as any);

      const result = await createEmailLog(emailData);

      expect(result).toBeDefined();
      expect(result.id).toBe('log-1');
      expect(prisma.emailLog.create).toHaveBeenCalled();
    });

    it('should handle optional campaign ID', async () => {
      const emailData = {
        templateId: 'template-1',
        recipientEmail: 'test@example.com',
        campaignId: 'campaign-1',
      };

      vi.mocked(prisma.emailLog.create).mockResolvedValue({
        id: 'log-1',
        ...emailData,
      } as any);

      const result = await createEmailLog(emailData);

      expect(result).toBeDefined();
    });
  });

  describe('getEmailLogs', () => {
    it('should fetch email logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          templateId: 'template-1',
          recipientEmail: 'test@example.com',
          status: 'SENT' as EmailStatus,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.template.findMany).mockResolvedValue([
        { id: 'template-1' },
      ] as any);
      vi.mocked(prisma.emailLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.emailLog.count).mockResolvedValue(1);

      const result = await getEmailLogs({
        organizationId: 'org-1',
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by campaign ID', async () => {
      vi.mocked(prisma.emailLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.emailLog.count).mockResolvedValue(0);

      await getEmailLogs({
        campaignId: 'campaign-1',
        limit: 10,
        offset: 0,
      });

      expect(prisma.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campaignId: 'campaign-1',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.emailLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.emailLog.count).mockResolvedValue(0);

      await getEmailLogs({
        status: 'SENT' as EmailStatus,
        limit: 10,
        offset: 0,
      });

      expect(prisma.emailLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SENT',
          }),
        })
      );
    });
  });

  describe('getEmailStatistics', () => {
    it('should calculate email statistics', async () => {
      vi.mocked(prisma.template.findMany).mockResolvedValue([
        { id: 'template-1' },
      ] as any);
      vi.mocked(prisma.emailLog.count).mockResolvedValue(100);
      vi.mocked(prisma.emailEvent.count).mockResolvedValue(50);

      const result = await getEmailStatistics({
        organizationId: 'org-1',
      });

      expect(result.total).toBe(100);
      expect(result.sent).toBe(100);
      expect(result.delivered).toBe(100);
      expect(result.opened).toBe(50);
      expect(result.clicked).toBe(50);
    });

    it('should calculate rates correctly', async () => {
      vi.mocked(prisma.template.findMany).mockResolvedValue([
        { id: 'template-1' },
      ] as any);
      vi.mocked(prisma.emailLog.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // sent
        .mockResolvedValueOnce(70)   // delivered
        .mockResolvedValueOnce(0)    // bounced
        .mockResolvedValueOnce(0);  // failed
      vi.mocked(prisma.emailEvent.count)
        .mockResolvedValueOnce(35)  // opened
        .mockResolvedValueOnce(20); // clicked

      const result = await getEmailStatistics({
        organizationId: 'org-1',
      });

      expect(result.deliveryRate).toBeCloseTo(87.5); // 70/80 * 100
      expect(result.openRate).toBeCloseTo(50); // 35/70 * 100
      expect(result.clickRate).toBeCloseTo(28.57, 1); // 20/70 * 100
    });
  });
});

