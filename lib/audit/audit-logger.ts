/**
 * Audit Logger
 * Logs user actions for compliance and security
 */

import { prisma } from "@/lib/db/prisma";
import type { AuditLog } from "@prisma/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "SEND"
  | "LOGIN"
  | "LOGOUT"
  | "INVITE"
  | "REMOVE"
  | "EXPORT"
  | "IMPORT";

export type AuditResource =
  | "TEMPLATE"
  | "CAMPAIGN"
  | "SMTP_PROFILE"
  | "ORGANIZATION"
  | "TEAM_MEMBER"
  | "USER"
  | "EMAIL_LOG"
  | "BOUNCE"
  | "UNSUBSCRIBE"
  | "SETTINGS"
  | string; // Allow any string for flexibility

export interface AuditLogDetails {
  userId: string;
  organizationId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function logAuditAction(
  details: AuditLogDetails
): Promise<AuditLog> {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: details.userId,
        organizationId: details.organizationId,
        action: details.action,
        resourceType: details.resource,
        resourceId: details.resourceId || null,
        changes: details.details || {},
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
    throw error;
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  organizationId: string,
  filters?: {
    userId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  try {
    const where: any = {
      organizationId,
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resourceType = filters.resource;
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error("Error getting audit logs:", error);
    throw error;
  }
}

