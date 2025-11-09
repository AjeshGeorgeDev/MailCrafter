"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { getAuditLogs } from "@/lib/audit/audit-logger";
import type { AuditAction, AuditResource } from "@/lib/audit/audit-logger";

/**
 * Get audit logs
 */
export async function getAuditLogsAction(filters?: {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (only ADMIN and OWNER can view audit logs)
    if (!["OWNER", "ADMIN"].includes(orgMember.role)) {
      return { error: "Insufficient permissions" };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const result = await getAuditLogs(orgMember.organization.id, {
      userId: filters?.userId,
      action: filters?.action,
      resource: filters?.resource,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
      limit,
      offset,
    });

    return {
      success: true,
      logs: result.logs,
      total: result.total,
      page,
      limit,
    };
  } catch (error: any) {
    console.error("Get audit logs error:", error);
    return { error: error.message || "Failed to get audit logs" };
  }
}

