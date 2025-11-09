import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, createNotification } from '@/app/actions/notifications';
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
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('Notification Actions', () => {
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

  describe('getNotifications', () => {
    it('should return notifications for authenticated user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: testUser.id,
          organizationId: testOrg.id,
          type: 'campaign_completed',
          title: 'Campaign Completed',
          message: 'Your campaign has finished',
          link: '/dashboard/campaigns/1',
          isRead: false,
          createdAt: new Date(),
          metadata: {},
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(1);

      const result = await getNotifications();

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });

    it('should return empty array when no notifications exist', async () => {
      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0);

      const result = await getNotifications();

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(0);
      expect(result.unreadCount).toBe(0);
    });

    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await getNotifications();

      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = {
        id: 'notif-1',
        userId: testUser.id,
        isRead: false,
      };

      vi.mocked(prisma.notification.findFirst).mockResolvedValue(notification as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...notification,
        isRead: true,
        readAt: new Date(),
      } as any);

      const result = await markNotificationAsRead('notif-1');

      expect(result.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should return error if notification not found', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

      const result = await markNotificationAsRead('notif-1');

      expect(result.error).toBe('Notification not found');
    });

    it('should return error if notification belongs to different user', async () => {
      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null);

      const result = await markNotificationAsRead('notif-1');

      expect(result.error).toBe('Notification not found');
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue({
        userId: testUser.id,
        organizationId: testOrg.id,
        organization: testOrg,
      } as any);
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const result = await markAllNotificationsAsRead();

      expect(result.success).toBe(true);
      expect(prisma.notification.updateMany).toHaveBeenCalled();
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        userId: testUser.id,
        organizationId: testOrg.id,
        type: 'campaign_completed',
        title: 'Campaign Completed',
        message: 'Your campaign has finished',
        link: '/dashboard/campaigns/1',
      };

      const createdNotification = {
        id: 'notif-1',
        ...notificationData,
        isRead: false,
        createdAt: new Date(),
        metadata: {},
      };

      vi.mocked(prisma.notification.create).mockResolvedValue(createdNotification as any);

      const result = await createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          ...notificationData,
          metadata: {},
        },
      });
    });
  });
});

