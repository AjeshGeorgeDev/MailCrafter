import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export interface CreateSegmentData {
  organizationId: string;
  name: string;
  conditions: Prisma.JsonValue;
}

export interface UpdateSegmentData {
  name?: string;
  conditions?: Prisma.JsonValue;
}

export interface SegmentCondition {
  field: string;
  operator: "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "is" | "isNot" | "in" | "notIn";
  value: string | number | boolean | string[];
  logic?: "AND" | "OR";
}

export interface SegmentRule {
  conditions: SegmentCondition[];
  logic?: "AND" | "OR"; // Logic between condition groups
}

/**
 * Create a new segment
 */
export async function createSegment(data: CreateSegmentData) {
  try {
    const segment = await prisma.segment.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        conditions: data.conditions || {},
        contactCount: 0, // Will be calculated
      },
    });

    // Calculate and update contact count
    const count = await calculateSegmentContactCount(segment.id, data.organizationId);
    await prisma.segment.update({
      where: { id: segment.id },
      data: { contactCount: count },
    });

    return { ...segment, contactCount: count };
  } catch (error) {
    console.error("Error creating segment:", error);
    throw error;
  }
}

/**
 * Get segment by ID
 */
export async function getSegmentById(id: string, organizationId: string) {
  try {
    return await prisma.segment.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  } catch (error) {
    console.error("Error fetching segment by ID:", error);
    throw error;
  }
}

/**
 * Get all segments for an organization
 */
export async function getSegmentsByOrganization(organizationId: string) {
  try {
    return await prisma.segment.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching segments:", error);
    throw error;
  }
}

/**
 * Update segment
 */
export async function updateSegment(
  id: string,
  organizationId: string,
  data: UpdateSegmentData
) {
  try {
    // Prepare update data, handling null values for Json fields
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    
    // Remove conditions if it's null/undefined (don't update it)
    if (updateData.conditions === null || updateData.conditions === undefined) {
      delete updateData.conditions;
    }

    const segment = await prisma.segment.updateMany({
      where: {
        id,
        organizationId,
      },
      data: updateData,
    });

    if (segment.count === 0) {
      return null;
    }

    // Recalculate contact count if conditions changed
    if (data.conditions) {
      const count = await calculateSegmentContactCount(id, organizationId);
      await prisma.segment.update({
        where: { id },
        data: { contactCount: count },
      });
    }

    return await getSegmentById(id, organizationId);
  } catch (error) {
    console.error("Error updating segment:", error);
    throw error;
  }
}

/**
 * Delete segment
 */
export async function deleteSegment(id: string, organizationId: string) {
  try {
    return await prisma.segment.deleteMany({
      where: {
        id,
        organizationId,
      },
    });
  } catch (error) {
    console.error("Error deleting segment:", error);
    throw error;
  }
}

/**
 * Calculate contact count for a segment
 * This is a placeholder - actual evaluation will be done in segment-evaluator.ts
 */
async function calculateSegmentContactCount(
  segmentId: string,
  organizationId: string
): Promise<number> {
  try {
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        organizationId,
      },
    });

    if (!segment) {
      return 0;
    }

    // Get all contacts for the organization
    const contactLists = await prisma.contactList.findMany({
      where: { organizationId },
      include: {
        contacts: true,
      },
    });

    // Flatten all contacts
    const allContacts = contactLists.flatMap((list) => list.contacts);

    // Import evaluator dynamically to avoid circular dependencies
    const { evaluateSegmentConditions } = await import("../segments/segment-evaluator");
    
    // Filter contacts based on segment conditions
    const matchingContacts = allContacts.filter((contact) =>
      evaluateSegmentConditions(contact, segment.conditions as any)
    );

    return matchingContacts.length;
  } catch (error) {
    console.error("Error calculating segment contact count:", error);
    return 0;
  }
}

/**
 * Get contacts that match a segment
 */
export async function getSegmentContacts(
  segmentId: string,
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  try {
    const segment = await prisma.segment.findFirst({
      where: {
        id: segmentId,
        organizationId,
      },
    });

    if (!segment) {
      return [];
    }

    // Get all contacts for the organization
    const contactLists = await prisma.contactList.findMany({
      where: { organizationId },
      include: {
        contacts: {
          take: options?.limit,
          skip: options?.offset,
        },
      },
    });

    // Flatten all contacts
    const allContacts = contactLists.flatMap((list) => list.contacts);

    // Import evaluator dynamically to avoid circular dependencies
    const { evaluateSegmentConditions } = await import("../segments/segment-evaluator");
    
    // Filter contacts based on segment conditions
    const matchingContacts = allContacts.filter((contact) =>
      evaluateSegmentConditions(contact, segment.conditions as any)
    );

    return matchingContacts;
  } catch (error) {
    console.error("Error getting segment contacts:", error);
    return [];
  }
}

