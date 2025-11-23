"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  createSegment,
  getSegmentById,
  getSegmentsByOrganization,
  updateSegment,
  deleteSegment,
  getSegmentContacts,
  type CreateSegmentData,
  type UpdateSegmentData,
} from "@/lib/db/segments";
import { validateSegmentConditions } from "@/lib/segments/segment-evaluator";
import { revalidatePath } from "next/cache";

/**
 * Segment creation schema
 */
const createSegmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  conditions: z.any(), // JSON object with conditions
});

/**
 * Segment update schema
 */
const updateSegmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  conditions: z.any().optional(),
});

/**
 * Create a new segment
 */
export async function createSegmentAction(data: z.infer<typeof createSegmentSchema>) {
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

    // Validate input
    const validated = createSegmentSchema.parse(data);

    // Validate conditions structure
    const validation = validateSegmentConditions(validated.conditions);
    if (!validation.valid) {
      return { error: validation.error || "Invalid segment conditions" };
    }

    // Create segment
    const segmentData: CreateSegmentData = {
      organizationId: orgMember.organization.id,
      name: validated.name,
      conditions: validated.conditions,
    };

    const segment = await createSegment(segmentData);

    revalidatePath("/dashboard/segments");
    return { success: true, segment };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || "Validation error" };
    }
    console.error("Create segment error:", error);
    return { error: error?.message || "Failed to create segment" };
  }
}

/**
 * Get all segments for the current organization
 */
export async function getSegmentsAction() {
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

    const segments = await getSegmentsByOrganization(orgMember.organization.id);

    return { success: true, segments };
  } catch (error: any) {
    console.error("Get segments error:", error);
    return { error: error.message || "Failed to get segments" };
  }
}

/**
 * Get segment by ID
 */
export async function getSegmentByIdAction(id: string) {
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

    const segment = await getSegmentById(id, orgMember.organization.id);

    if (!segment) {
      return { error: "Segment not found" };
    }

    return { success: true, segment };
  } catch (error: any) {
    console.error("Get segment error:", error);
    return { error: error.message || "Failed to get segment" };
  }
}

/**
 * Update segment
 */
export async function updateSegmentAction(
  id: string,
  data: z.infer<typeof updateSegmentSchema>
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

    // Validate input
    const validated = updateSegmentSchema.parse(data);

    // Validate conditions if provided
    if (validated.conditions) {
      const validation = validateSegmentConditions(validated.conditions);
      if (!validation.valid) {
        return { error: validation.error || "Invalid segment conditions" };
      }
    }

    // Update segment
    const updateData: UpdateSegmentData = {
      name: validated.name,
      conditions: validated.conditions,
    };

    const segment = await updateSegment(id, orgMember.organization.id, updateData);

    if (!segment) {
      return { error: "Segment not found" };
    }

    revalidatePath("/dashboard/segments");
    revalidatePath(`/dashboard/segments/${id}`);
    return { success: true, segment };
  } catch (error: any) {
    console.error("Update segment error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || "Validation error" };
    }
    return { error: error.message || "Failed to update segment" };
  }
}

/**
 * Delete segment
 */
export async function deleteSegmentAction(id: string) {
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

    const result = await deleteSegment(id, orgMember.organization.id);

    if (result.count === 0) {
      return { error: "Segment not found" };
    }

    revalidatePath("/dashboard/segments");
    return { success: true };
  } catch (error: any) {
    console.error("Delete segment error:", error);
    return { error: error.message || "Failed to delete segment" };
  }
}

/**
 * Preview segment contacts (get matching contacts)
 */
export async function previewSegmentAction(
  segmentId: string,
  options?: { limit?: number; offset?: number }
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

    // Verify segment exists and belongs to organization
    const segment = await getSegmentById(segmentId, orgMember.organization.id);
    if (!segment) {
      return { error: "Segment not found" };
    }

    const contacts = await getSegmentContacts(segmentId, orgMember.organization.id, options);

    return { success: true, contacts, count: contacts.length };
  } catch (error: any) {
    console.error("Preview segment error:", error);
    return { error: error.message || "Failed to preview segment" };
  }
}

/**
 * Calculate segment contact count (refresh count)
 */
export async function refreshSegmentCountAction(segmentId: string) {
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

    // Verify segment exists
    const segment = await getSegmentById(segmentId, orgMember.organization.id);
    if (!segment) {
      return { error: "Segment not found" };
    }

    // Recalculate count by updating the segment (this triggers count calculation)
    const updated = await updateSegment(segmentId, orgMember.organization.id, {
      conditions: segment.conditions,
    });

    if (!updated) {
      return { error: "Failed to refresh segment count" };
    }

    revalidatePath("/dashboard/segments");
    revalidatePath(`/dashboard/segments/${segmentId}`);
    return { success: true, contactCount: updated.contactCount };
  } catch (error: any) {
    console.error("Refresh segment count error:", error);
    return { error: error.message || "Failed to refresh segment count" };
  }
}

