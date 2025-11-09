"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { logAuditAction } from "@/lib/audit/audit-logger";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Get current user's organization
 */
export async function getOrganization() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: true,
      },
    });

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    return { success: true, organization: orgMember.organization };
  } catch (error) {
    console.error("Get organization error:", error);
    return { error: "Failed to get organization" };
  }
}

/**
 * Update organization
 */
export async function updateOrganization(data: {
  name?: string;
  defaultLanguage?: string;
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

    // Check permissions
    requirePermission(orgMember.role, "organization.edit");

    // Update organization
    const updated = await prisma.organization.update({
      where: { id: orgMember.organization.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.defaultLanguage && { defaultLanguage: data.defaultLanguage }),
      },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "UPDATE",
      resource: "ORGANIZATION",
      resourceId: orgMember.organization.id,
      details: { changes: data },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/organization");
    return { success: true, organization: updated };
  } catch (error: any) {
    console.error("Update organization error:", error);
    return { error: error.message || "Failed to update organization" };
  }
}

/**
 * Delete organization (OWNER only)
 */
export async function deleteOrganization() {
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

    // Only OWNER can delete
    if (orgMember.role !== "OWNER") {
      return { error: "Only organization owners can delete the organization" };
    }

    requirePermission(orgMember.role, "organization.delete");

    // Delete organization (cascade will handle related data)
    await prisma.organization.delete({
      where: { id: orgMember.organization.id },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "DELETE",
      resource: "ORGANIZATION",
      resourceId: orgMember.organization.id,
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete organization error:", error);
    return { error: error.message || "Failed to delete organization" };
  }
}

