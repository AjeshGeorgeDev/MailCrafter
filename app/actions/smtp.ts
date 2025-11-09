"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "@/lib/security/encryption";
import {
  createSMTPProfileSchema,
  updateSMTPProfileSchema,
  type CreateSMTPProfileInput,
  type UpdateSMTPProfileInput,
} from "@/lib/validations/smtp";

/**
 * Create SMTP Profile
 */
export async function createSMTPProfile(data: CreateSMTPProfileInput) {
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

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (OWNER, ADMIN, EDITOR can create)
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions. Editor access required." };
    }

    // Validate input
    const validated = createSMTPProfileSchema.parse(data);

    // Encrypt password before saving
    const encryptedPassword = encrypt(validated.password);

    // If this is set as default, unset other defaults in the organization
    if (validated.isDefault) {
      await prisma.smtpProfile.updateMany({
        where: {
          organizationId: orgMember.organization.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create SMTP profile
    const profile = await prisma.smtpProfile.create({
      data: {
        organizationId: orgMember.organization.id,
        name: validated.name,
        host: validated.host,
        port: validated.port,
        username: validated.username,
        password: encryptedPassword,
        encryption: validated.encryption,
        fromEmail: validated.fromEmail,
        fromName: validated.fromName || null,
        replyTo: validated.replyTo || null,
        maxHourlyRate: validated.maxHourlyRate || null,
        isDefault: validated.isDefault,
        isActive: true,
      },
    });

    revalidatePath("/settings/smtp");
    return { success: true, profile: { ...profile, password: undefined } }; // Never return password
  } catch (error) {
    console.error("Create SMTP profile error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create SMTP profile" };
  }
}

/**
 * Get all SMTP profiles for organization
 * Never returns passwords
 */
export async function getSMTPProfiles() {
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

    if (!orgMember?.organization) {
      return { profiles: [] };
    }

    const profiles = await prisma.smtpProfile.findMany({
      where: {
        organizationId: orgMember.organization.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        // password: NEVER include
        encryption: true,
        fromEmail: true,
        fromName: true,
        replyTo: true,
        isActive: true,
        isDefault: true,
        maxHourlyRate: true,
        testedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, profiles };
  } catch (error) {
    console.error("Get SMTP profiles error:", error);
    return { error: "Failed to get SMTP profiles" };
  }
}

/**
 * Get single SMTP profile
 * Never returns password
 */
export async function getSMTPProfile(id: string) {
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

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        // password: NEVER include
        encryption: true,
        fromEmail: true,
        fromName: true,
        replyTo: true,
        isActive: true,
        isDefault: true,
        maxHourlyRate: true,
        testedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return { error: "SMTP profile not found" };
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Get SMTP profile error:", error);
    return { error: "Failed to get SMTP profile" };
  }
}

/**
 * Update SMTP Profile
 */
export async function updateSMTPProfile(id: string, data: UpdateSMTPProfileInput) {
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

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions. Editor access required." };
    }

    // Verify profile exists and belongs to organization
    const existingProfile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!existingProfile) {
      return { error: "SMTP profile not found" };
    }

    // Validate input
    const validated = updateSMTPProfileSchema.parse(data);

    // Prepare update data
    const updateData: any = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.host !== undefined) updateData.host = validated.host;
    if (validated.port !== undefined) updateData.port = validated.port;
    if (validated.username !== undefined) updateData.username = validated.username;
    if (validated.password !== undefined) {
      // Encrypt new password
      updateData.password = encrypt(validated.password);
    }
    if (validated.encryption !== undefined) updateData.encryption = validated.encryption;
    if (validated.fromEmail !== undefined) updateData.fromEmail = validated.fromEmail;
    if (validated.fromName !== undefined) updateData.fromName = validated.fromName || null;
    if (validated.replyTo !== undefined) updateData.replyTo = validated.replyTo || null;
    if (validated.maxHourlyRate !== undefined) updateData.maxHourlyRate = validated.maxHourlyRate || null;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.isDefault !== undefined) updateData.isDefault = validated.isDefault;

    // If setting as default, unset other defaults
    if (validated.isDefault === true) {
      await prisma.smtpProfile.updateMany({
        where: {
          organizationId: orgMember.organization.id,
          isDefault: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update profile
    const profile = await prisma.smtpProfile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        encryption: true,
        fromEmail: true,
        fromName: true,
        replyTo: true,
        isActive: true,
        isDefault: true,
        maxHourlyRate: true,
        testedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath("/settings/smtp");
    return { success: true, profile };
  } catch (error) {
    console.error("Update SMTP profile error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update SMTP profile" };
  }
}

/**
 * Delete SMTP Profile
 */
export async function deleteSMTPProfile(id: string) {
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

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions (OWNER, ADMIN only)
    if (!["OWNER", "ADMIN"].includes(orgMember.role)) {
      return { error: "Insufficient permissions. Admin access required." };
    }

    // Verify profile exists and belongs to organization
    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
      include: {
        campaigns: {
          where: {
            status: { in: ["DRAFT", "SCHEDULED", "SENDING"] },
          },
          take: 1,
        },
      },
    });

    if (!profile) {
      return { error: "SMTP profile not found" };
    }

    // Check if used in active campaigns
    if (profile.campaigns.length > 0) {
      return { error: "Cannot delete SMTP profile. It is being used in active campaigns." };
    }

    // Check if it's the only default profile
    if (profile.isDefault) {
      const otherProfiles = await prisma.smtpProfile.count({
        where: {
          organizationId: orgMember.organization.id,
          id: { not: id },
          isActive: true,
        },
      });

      if (otherProfiles === 0) {
        return { error: "Cannot delete the only SMTP profile. Create another profile first." };
      }
    }

    // Delete profile
    await prisma.smtpProfile.delete({
      where: { id },
    });

    revalidatePath("/settings/smtp");
    return { success: true };
  } catch (error) {
    console.error("Delete SMTP profile error:", error);
    return { error: "Failed to delete SMTP profile" };
  }
}

/**
 * Set Default SMTP Profile
 */
export async function setDefaultSMTPProfile(id: string) {
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

    if (!orgMember?.organization) {
      return { error: "User is not part of an organization" };
    }

    // Check permissions
    if (orgMember.role === "VIEWER") {
      return { error: "Insufficient permissions. Editor access required." };
    }

    // Verify profile exists and belongs to organization
    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
        isActive: true,
      },
    });

    if (!profile) {
      return { error: "SMTP profile not found or inactive" };
    }

    // Unset other defaults
    await prisma.smtpProfile.updateMany({
      where: {
        organizationId: orgMember.organization.id,
        isDefault: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this as default
    await prisma.smtpProfile.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    revalidatePath("/settings/smtp");
    return { success: true };
  } catch (error) {
    console.error("Set default SMTP profile error:", error);
    return { error: "Failed to set default SMTP profile" };
  }
}

