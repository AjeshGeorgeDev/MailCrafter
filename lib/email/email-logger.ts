/**
 * Email Logging Service
 * Functions for creating and managing email logs
 */

import { prisma } from "@/lib/db/prisma";
import type { EmailStatus, EventType } from "@prisma/client";

export interface CreateEmailLogData {
  templateId: string;
  recipientEmail: string;
  languageCode?: string;
  variables?: Record<string, any>;
  campaignId?: string;
  status?: EmailStatus;
  smtpProfileId?: string;
}

export interface UpdateEmailLogData {
  status?: EmailStatus;
  smtpResponse?: string;
  errorMessage?: string;
  retryCount?: number;
  sentAt?: Date;
  deliveredAt?: Date;
}

export interface EmailEventData {
  eventType: EventType;
  metadata?: Record<string, any>;
}

/**
 * Create email log entry
 */
export async function createEmailLog(data: CreateEmailLogData) {
  const emailLog = await prisma.emailLog.create({
    data: {
      templateId: data.templateId,
      recipientEmail: data.recipientEmail,
      languageCode: data.languageCode || "en",
      variables: data.variables || {},
      status: data.status || "QUEUED",
      campaignId: data.campaignId || null,
    },
  });

  return emailLog;
}

/**
 * Update email log
 */
export async function updateEmailLog(
  id: string,
  updates: UpdateEmailLogData
) {
  const emailLog = await prisma.emailLog.update({
    where: { id },
    data: {
      ...updates,
      // Only update sentAt/deliveredAt if explicitly provided
      ...(updates.sentAt && { sentAt: updates.sentAt }),
      ...(updates.deliveredAt && { deliveredAt: updates.deliveredAt }),
    },
  });

  return emailLog;
}

/**
 * Log email event (open, click, bounce, etc.)
 */
export async function logEmailEvent(
  emailLogId: string,
  eventData: EmailEventData
) {
  const event = await prisma.emailEvent.create({
    data: {
      emailLogId,
      eventType: eventData.eventType,
      metadata: eventData.metadata || {},
    },
  });

  // Update email log status based on event type
  if (eventData.eventType === "OPENED") {
    // Don't update status, just log the event
    // Status remains SENT or DELIVERED
  } else if (eventData.eventType === "BOUNCED") {
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: { status: "BOUNCED" },
    });
  }
  // Note: DELIVERED is an EmailStatus, not an EventType
  // The DELIVERED status should be set when the email is successfully sent,
  // not as an event. Event types are for tracking user interactions after delivery.

  return event;
}

/**
 * Get email logs with filters
 */
export async function getEmailLogs(filters: {
  organizationId?: string;
  campaignId?: string;
  templateId?: string;
  recipientEmail?: string;
  status?: EmailStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    organizationId,
    campaignId,
    templateId,
    recipientEmail,
    status,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const where: any = {};

  if (campaignId) {
    where.campaignId = campaignId;
  }

  if (templateId) {
    where.templateId = templateId;
  }

  if (recipientEmail) {
    where.recipientEmail = {
      contains: recipientEmail,
      mode: "insensitive",
    };
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // If organizationId is provided, filter by templates in that org
  if (organizationId) {
    where.template = {
      organizationId,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        events: {
          orderBy: {
            timestamp: "desc",
          },
          take: 10, // Latest 10 events
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

/**
 * Get single email log with all details
 */
export async function getEmailLogDetails(id: string) {
  const emailLog = await prisma.emailLog.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      events: {
        orderBy: {
          timestamp: "desc",
        },
      },
      template: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return emailLog;
}

/**
 * Get email statistics
 */
export async function getEmailStatistics(filters: {
  organizationId?: string;
  campaignId?: string;
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};

  if (filters.campaignId) {
    where.campaignId = filters.campaignId;
  }

  if (filters.templateId) {
    where.templateId = filters.templateId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  if (filters.organizationId) {
    where.template = {
      organizationId: filters.organizationId,
    };
  }

  const [total, sent, delivered, opened, clicked, bounced, failed] =
    await Promise.all([
      prisma.emailLog.count({ where }),
      prisma.emailLog.count({ where: { ...where, status: "SENT" } }),
      prisma.emailLog.count({ where: { ...where, status: "DELIVERED" } }),
      prisma.emailEvent.count({
        where: {
          emailLog: where,
          eventType: "OPENED",
        },
      }),
      prisma.emailEvent.count({
        where: {
          emailLog: where,
          eventType: "CLICKED",
        },
      }),
      prisma.emailLog.count({ where: { ...where, status: "BOUNCED" } }),
      prisma.emailLog.count({ where: { ...where, status: "FAILED" } }),
    ]);

  return {
    total,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    failed,
    deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
  };
}

