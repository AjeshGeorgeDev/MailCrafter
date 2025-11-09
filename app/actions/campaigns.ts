"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { CampaignStatus } from "@prisma/client";

/**
 * Campaign creation schema
 */
const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  templateId: z.string().min(1, "Template ID is required"),
  subject: z.string().min(1, "Subject is required").max(255),
  smtpProfileId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * Campaign update schema
 */
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject: z.string().min(1).max(255).optional(),
  smtpProfileId: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

/**
 * Add recipients to campaign
 */
export async function addCampaignRecipients(
  campaignId: string,
  recipients: Array<{ email: string; name?: string; variables?: Record<string, any> }>
) {
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

    // Verify campaign exists and belongs to organization
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    // Create recipients
    await prisma.campaignRecipient.createMany({
      data: recipients.map((r) => ({
        campaignId,
        email: r.email,
        name: r.name || null,
        variables: r.variables || undefined, // Prisma JsonValue doesn't accept null, use undefined
      })),
      skipDuplicates: true, // Skip duplicate emails
    });

    // Update recipient count
    const recipientCount = await prisma.campaignRecipient.count({
      where: { campaignId },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { recipientCount },
    });

    revalidatePath(`/dashboard/campaigns/${campaignId}`);
    return { success: true, count: recipientCount };
  } catch (error) {
    console.error("Add campaign recipients error:", error);
    return { error: "Failed to add recipients" };
  }
}

/**
 * Create campaign
 */
export async function createCampaign(data: z.infer<typeof createCampaignSchema>) {
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
    const validated = createCampaignSchema.parse(data);

    // Verify template exists and belongs to organization
    const template = await prisma.template.findFirst({
      where: {
        id: validated.templateId,
        organizationId: orgMember.organization.id,
      },
    });

    if (!template) {
      return { error: "Template not found" };
    }

    // Get default SMTP profile if not provided
    let smtpProfileId = validated.smtpProfileId;
    if (!smtpProfileId) {
      const defaultProfile = await prisma.smtpProfile.findFirst({
        where: {
          organizationId: orgMember.organization.id,
          isDefault: true,
          isActive: true,
        },
        select: { id: true },
      });

      if (defaultProfile) {
        smtpProfileId = defaultProfile.id;
      }
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        organizationId: orgMember.organization.id,
        templateId: validated.templateId,
        name: validated.name,
        subject: validated.subject,
        smtpProfileId: smtpProfileId || null,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : null,
        status: validated.scheduledAt ? "SCHEDULED" : "DRAFT",
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true, campaign };
  } catch (error) {
    console.error("Create campaign error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create campaign" };
  }
}

/**
 * Get campaigns with filters
 */
export async function getCampaigns(filters: {
  status?: CampaignStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
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
      return { campaigns: [], total: 0 };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const where: any = {
      organizationId: orgMember.organization.id,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { subject: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          smtpProfile: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.campaign.count({ where }),
    ]);

    return { success: true, campaigns, total, page, limit };
  } catch (error) {
    console.error("Get campaigns error:", error);
    return { error: "Failed to get campaigns" };
  }
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string) {
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

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        smtpProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            emailLogs: true,
          },
        },
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    return { success: true, campaign };
  } catch (error) {
    console.error("Get campaign error:", error);
    return { error: "Failed to get campaign" };
  }
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: string,
  data: Partial<z.infer<typeof updateCampaignSchema>>
) {
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

    // Verify campaign exists and belongs to organization
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!existingCampaign) {
      return { error: "Campaign not found" };
    }

    // Can't update if campaign is sending or completed
    if (existingCampaign.status === "SENDING") {
      return { error: "Cannot update campaign while it is sending" };
    }

    // Validate input
    const validated = updateCampaignSchema.parse(data);

    // Prepare update data
    const updateData: any = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.subject !== undefined) updateData.subject = validated.subject;
    if (validated.smtpProfileId !== undefined)
      updateData.smtpProfileId = validated.smtpProfileId || null;
    if (validated.scheduledAt !== undefined) {
      updateData.scheduledAt = validated.scheduledAt
        ? new Date(validated.scheduledAt)
        : null;
      // Update status based on scheduledAt
      if (validated.scheduledAt) {
        updateData.status = "SCHEDULED";
      } else if (existingCampaign.status === "SCHEDULED") {
        updateData.status = "DRAFT";
      }
    }

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        smtpProfile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${id}`);
    return { success: true, campaign };
  } catch (error) {
    console.error("Update campaign error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update campaign" };
  }
}

/**
 * Delete campaign (soft delete by setting status)
 */
export async function deleteCampaign(id: string) {
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

    // Verify campaign exists and belongs to organization
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!campaign) {
      return { error: "Campaign not found" };
    }

    // Can't delete if campaign is sending
    if (campaign.status === "SENDING") {
      return { error: "Cannot delete campaign while it is sending" };
    }

    // Delete campaign (cascade will handle email logs)
    await prisma.campaign.delete({
      where: { id },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true };
  } catch (error) {
    console.error("Delete campaign error:", error);
    return { error: "Failed to delete campaign" };
  }
}

/**
 * Duplicate campaign
 */
export async function duplicateCampaign(id: string) {
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

    // Get original campaign
    const originalCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        organizationId: orgMember.organization.id,
      },
    });

    if (!originalCampaign) {
      return { error: "Campaign not found" };
    }

    // Create duplicate
    const duplicatedCampaign = await prisma.campaign.create({
      data: {
        organizationId: orgMember.organization.id,
        templateId: originalCampaign.templateId,
        name: `${originalCampaign.name} (Copy)`,
        subject: originalCampaign.subject,
        smtpProfileId: originalCampaign.smtpProfileId,
        status: "DRAFT",
        createdBy: user.id,
        // Don't copy scheduledAt, recipientCount, progress, etc.
      },
    });

    revalidatePath("/dashboard/campaigns");
    return { success: true, campaign: duplicatedCampaign };
  } catch (error) {
    console.error("Duplicate campaign error:", error);
    return { error: "Failed to duplicate campaign" };
  }
}

