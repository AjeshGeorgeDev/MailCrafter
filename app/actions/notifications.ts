"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit: number = 10) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(orgMember?.organization && {
          organizationId: orgMember.organization.id,
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        ...(orgMember?.organization && {
          organizationId: orgMember.organization.id,
        }),
      },
    });

    return {
      success: true,
      notifications,
      unreadCount,
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { error: "Failed to get notifications" };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    if (!notification) {
      return { error: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return { error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    // Get user's organization
    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
        ...(orgMember?.organization && {
          organizationId: orgMember.organization.id,
        }),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return { error: "Failed to mark all notifications as read" };
  }
}

/**
 * Create a notification (internal use)
 */
export async function createNotification(data: {
  userId: string;
  organizationId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata || {},
      },
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Create notification error:", error);
    return { error: "Failed to create notification" };
  }
}

