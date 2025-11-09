"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { logAuditAction } from "@/lib/audit/audit-logger";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Role } from "@prisma/client";
import { encrypt } from "@/lib/security/encryption";

/**
 * Get team members
 */
export async function getTeamMembers() {
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
    requirePermission(orgMember.role, "team.view");

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgMember.organization.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first, then ADMIN, etc.
        { joinedAt: "asc" },
      ],
    });

    return { success: true, members };
  } catch (error: any) {
    console.error("Get team members error:", error);
    return { error: error.message || "Failed to get team members" };
  }
}

/**
 * Invite team member
 */
export async function inviteTeamMember(data: { email: string; role: Role }) {
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
    requirePermission(orgMember.role, "team.invite");

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!invitedUser) {
      return {
        error: "User not found. They must register first before being invited.",
      };
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgMember.organization.id,
          userId: invitedUser.id,
        },
      },
    });

    if (existingMember) {
      return { error: "User is already a member of this organization" };
    }

    // Add member
    const member = await prisma.organizationMember.create({
      data: {
        organizationId: orgMember.organization.id,
        userId: invitedUser.id,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "INVITE",
      resource: "TEAM_MEMBER",
      resourceId: member.id,
      details: { email: data.email, role: data.role },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/team");
    return { success: true, member };
  } catch (error: any) {
    console.error("Invite team member error:", error);
    return { error: error.message || "Failed to invite team member" };
  }
}

/**
 * Update team member role
 */
export async function updateTeamMemberRole(
  memberId: string,
  role: Role
) {
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
    requirePermission(orgMember.role, "team.edit");

    // Get the member to update
    const memberToUpdate = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToUpdate) {
      return { error: "Member not found" };
    }

    if (memberToUpdate.organizationId !== orgMember.organization.id) {
      return { error: "Member does not belong to your organization" };
    }

    // Prevent changing OWNER role (or require special handling)
    if (memberToUpdate.role === "OWNER" && role !== "OWNER") {
      return { error: "Cannot change owner role" };
    }

    // Update role
    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "UPDATE",
      resource: "TEAM_MEMBER",
      resourceId: memberId,
      details: {
        previousRole: memberToUpdate.role,
        newRole: role,
        memberEmail: memberToUpdate.user.email,
      },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/team");
    return { success: true, member: updated };
  } catch (error: any) {
    console.error("Update team member role error:", error);
    return { error: error.message || "Failed to update team member role" };
  }
}

/**
 * Remove team member
 */
export async function removeTeamMember(memberId: string) {
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
    requirePermission(orgMember.role, "team.remove");

    // Get the member to remove
    const memberToRemove = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToRemove) {
      return { error: "Member not found" };
    }

    if (memberToRemove.organizationId !== orgMember.organization.id) {
      return { error: "Member does not belong to your organization" };
    }

    // Prevent removing OWNER
    if (memberToRemove.role === "OWNER") {
      return { error: "Cannot remove organization owner" };
    }

    // Prevent removing yourself
    if (memberToRemove.userId === user.id) {
      return { error: "Cannot remove yourself from the organization" };
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    // Log audit action
    const headersList = await headers();
    await logAuditAction({
      userId: user.id,
      organizationId: orgMember.organization.id,
      action: "REMOVE",
      resource: "TEAM_MEMBER",
      resourceId: memberId,
      details: {
        memberEmail: memberToRemove.user.email,
        memberRole: memberToRemove.role,
      },
      ipAddress:
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        undefined,
      userAgent: headersList.get("user-agent") || undefined,
    });

    revalidatePath("/dashboard/settings/team");
    return { success: true };
  } catch (error: any) {
    console.error("Remove team member error:", error);
    return { error: error.message || "Failed to remove team member" };
  }
}

