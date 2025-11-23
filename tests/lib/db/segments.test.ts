/**
 * Tests for Segment Database Utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSegment,
  getSegmentById,
  getSegmentsByOrganization,
  updateSegment,
  deleteSegment,
  getSegmentContacts,
} from "@/lib/db/segments";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    segment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    contactList: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/segments/segment-evaluator", () => ({
  evaluateSegmentConditions: vi.fn((contact, conditions) => {
    // Simple mock: match if email contains "test"
    return contact.email.includes("test");
  }),
}));

describe("Segment Database Utilities", () => {
  const mockOrganizationId = "org-1";
  const mockSegmentId = "segment-1";

  const mockSegment = {
    id: mockSegmentId,
    organizationId: mockOrganizationId,
    name: "Test Segment",
    conditions: {
      conditions: [
        {
          field: "email",
          operator: "contains",
          value: "test",
        },
      ],
    },
    contactCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContacts = [
    {
      id: "contact-1",
      listId: "list-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      customFields: null,
      status: "SUBSCRIBED" as const,
      subscribedAt: new Date(),
      unsubscribedAt: null,
    },
    {
      id: "contact-2",
      listId: "list-1",
      email: "other@example.com",
      firstName: "Other",
      lastName: "User",
      customFields: null,
      status: "SUBSCRIBED" as const,
      subscribedAt: new Date(),
      unsubscribedAt: null,
    },
  ];

  const mockContactList = {
    id: "list-1",
    organizationId: mockOrganizationId,
    name: "Test List",
    description: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    contacts: mockContacts,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSegment", () => {
    it("should create a segment and calculate contact count", async () => {
      const createdSegment = { ...mockSegment, contactCount: 0 };
      const updatedSegment = { ...mockSegment, contactCount: 1 };
      
      (prisma.segment.create as any).mockResolvedValue(createdSegment);
      (prisma.segment.findFirst as any).mockResolvedValue(createdSegment);
      (prisma.segment.update as any).mockResolvedValue(updatedSegment);
      (prisma.contactList.findMany as any).mockResolvedValue([mockContactList]);

      const result = await createSegment({
        organizationId: mockOrganizationId,
        name: "Test Segment",
        conditions: mockSegment.conditions,
      });

      expect(prisma.segment.create).toHaveBeenCalledWith({
        data: {
          organizationId: mockOrganizationId,
          name: "Test Segment",
          conditions: mockSegment.conditions,
          contactCount: 0,
        },
      });

      // The function returns the updated segment with the calculated count
      expect(result.contactCount).toBe(1);
    });

    it("should throw error on database failure", async () => {
      (prisma.segment.create as any).mockRejectedValue(new Error("Database error"));

      await expect(
        createSegment({
          organizationId: mockOrganizationId,
          name: "Test Segment",
          conditions: mockSegment.conditions,
        })
      ).rejects.toThrow("Database error");
    });
  });

  describe("getSegmentById", () => {
    it("should return segment by ID", async () => {
      (prisma.segment.findFirst as any).mockResolvedValue(mockSegment);

      const result = await getSegmentById(mockSegmentId, mockOrganizationId);

      expect(prisma.segment.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockSegmentId,
          organizationId: mockOrganizationId,
        },
      });

      expect(result).toEqual(mockSegment);
    });

    it("should return null if segment not found", async () => {
      (prisma.segment.findFirst as any).mockResolvedValue(null);

      const result = await getSegmentById("non-existent", mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe("getSegmentsByOrganization", () => {
    it("should return all segments for organization", async () => {
      (prisma.segment.findMany as any).mockResolvedValue([mockSegment]);

      const result = await getSegmentsByOrganization(mockOrganizationId);

      expect(prisma.segment.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrganizationId },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual([mockSegment]);
    });
  });

  describe("updateSegment", () => {
    it("should update segment", async () => {
      const updatedSegment = {
        ...mockSegment,
        name: "Updated Segment",
      };

      (prisma.segment.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.segment.findFirst as any).mockResolvedValue(updatedSegment);
      (prisma.segment.update as any).mockResolvedValue(updatedSegment);
      (prisma.contactList.findMany as any).mockResolvedValue([mockContactList]);

      const result = await updateSegment(mockSegmentId, mockOrganizationId, {
        name: "Updated Segment",
      });

      expect(prisma.segment.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockSegmentId,
          organizationId: mockOrganizationId,
        },
        data: {
          name: "Updated Segment",
          updatedAt: expect.any(Date),
        },
      });

      expect(result?.name).toBe("Updated Segment");
    });

    it("should return null if segment not found", async () => {
      (prisma.segment.updateMany as any).mockResolvedValue({ count: 0 });

      const result = await updateSegment("non-existent", mockOrganizationId, {
        name: "Updated",
      });

      expect(result).toBeNull();
    });

    it("should recalculate contact count when conditions change", async () => {
      (prisma.segment.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.segment.findFirst as any)
        .mockResolvedValueOnce(mockSegment)
        .mockResolvedValueOnce({
          ...mockSegment,
          contactCount: 1,
        });
      (prisma.segment.update as any).mockResolvedValue({
        ...mockSegment,
        contactCount: 1,
      });
      (prisma.contactList.findMany as any).mockResolvedValue([mockContactList]);

      const result = await updateSegment(mockSegmentId, mockOrganizationId, {
        conditions: mockSegment.conditions,
      });

      expect(result?.contactCount).toBe(1);
    });
  });

  describe("deleteSegment", () => {
    it("should delete segment", async () => {
      (prisma.segment.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await deleteSegment(mockSegmentId, mockOrganizationId);

      expect(prisma.segment.deleteMany).toHaveBeenCalledWith({
        where: {
          id: mockSegmentId,
          organizationId: mockOrganizationId,
        },
      });

      expect(result.count).toBe(1);
    });
  });

  describe("getSegmentContacts", () => {
    it("should return matching contacts for segment", async () => {
      (prisma.segment.findFirst as any).mockResolvedValue(mockSegment);
      (prisma.contactList.findMany as any).mockResolvedValue([mockContactList]);

      const result = await getSegmentContacts(mockSegmentId, mockOrganizationId);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("test@example.com");
    });

    it("should return empty array if segment not found", async () => {
      (prisma.segment.findFirst as any).mockResolvedValue(null);

      const result = await getSegmentContacts("non-existent", mockOrganizationId);

      expect(result).toEqual([]);
    });

    it("should respect limit and offset", async () => {
      (prisma.segment.findFirst as any).mockResolvedValue(mockSegment);
      (prisma.contactList.findMany as any).mockResolvedValue([mockContactList]);

      const result = await getSegmentContacts(mockSegmentId, mockOrganizationId, {
        limit: 1,
        offset: 0,
      });

      expect(result.length).toBeLessThanOrEqual(1);
    });
  });
});

