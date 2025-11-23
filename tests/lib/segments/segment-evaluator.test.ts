/**
 * Tests for Segment Evaluator
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  evaluateSegmentConditions,
  validateSegmentConditions,
  type SegmentCondition,
  type SegmentConditions,
} from "@/lib/segments/segment-evaluator";
import type { Contact } from "@prisma/client";

describe("Segment Evaluator", () => {
  const mockContact: Contact = {
    id: "contact-1",
    listId: "list-1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    customFields: {
      age: 30,
      city: "New York",
    },
    status: "SUBSCRIBED",
    subscribedAt: new Date("2024-01-01"),
    unsubscribedAt: null,
  };

  describe("evaluateSegmentConditions", () => {
    it("should match contact with equals condition on email", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "equals",
            value: "john.doe@example.com",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should not match contact with equals condition on wrong email", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "equals",
            value: "jane.doe@example.com",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(false);
    });

    it("should match contact with contains condition", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "contains",
            value: "example.com",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should match contact with startsWith condition", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "firstName",
            operator: "startsWith",
            value: "Jo",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should match contact with status condition", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "status",
            operator: "is",
            value: "SUBSCRIBED",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should match contact with AND logic (all conditions must match)", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "contains",
            value: "example.com",
          },
          {
            field: "status",
            operator: "is",
            value: "SUBSCRIBED",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should not match contact with AND logic when one condition fails", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "contains",
            value: "example.com",
          },
          {
            field: "status",
            operator: "is",
            value: "UNSUBSCRIBED",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(false);
    });

    it("should match contact with OR logic (any condition matches)", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "email",
            operator: "equals",
            value: "wrong@example.com",
          },
          {
            field: "status",
            operator: "is",
            value: "SUBSCRIBED",
          },
        ],
        logic: "OR",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should match contact with rules format", () => {
      const conditions: SegmentConditions = {
        rules: [
          {
            conditions: [
              {
                field: "email",
                operator: "contains",
                value: "example.com",
              },
            ],
            logic: "AND",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should match contact with multiple rules (AND logic)", () => {
      const conditions: SegmentConditions = {
        rules: [
          {
            conditions: [
              {
                field: "email",
                operator: "contains",
                value: "example.com",
              },
            ],
            logic: "AND",
          },
          {
            conditions: [
              {
                field: "status",
                operator: "is",
                value: "SUBSCRIBED",
              },
            ],
            logic: "AND",
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should handle custom fields", () => {
      const conditions: SegmentConditions = {
        conditions: [
          {
            field: "age",
            operator: "greaterThan",
            value: 25,
          },
        ],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });

    it("should return true for empty conditions (match all)", () => {
      const conditions: SegmentConditions = {
        conditions: [],
        logic: "AND",
      };

      expect(evaluateSegmentConditions(mockContact, conditions)).toBe(true);
    });
  });

  describe("validateSegmentConditions", () => {
    it("should validate conditions format", () => {
      const conditions = {
        conditions: [
          {
            field: "email",
            operator: "equals",
            value: "test@example.com",
          },
        ],
        logic: "AND",
      };

      const result = validateSegmentConditions(conditions);
      expect(result.valid).toBe(true);
    });

    it("should validate rules format", () => {
      const conditions = {
        rules: [
          {
            conditions: [
              {
                field: "email",
                operator: "equals",
                value: "test@example.com",
              },
            ],
            logic: "AND",
          },
        ],
        logic: "AND",
      };

      const result = validateSegmentConditions(conditions);
      expect(result.valid).toBe(true);
    });

    it("should reject invalid conditions (missing field)", () => {
      const conditions = {
        conditions: [
          {
            operator: "equals",
            value: "test@example.com",
          },
        ],
        logic: "AND",
      };

      const result = validateSegmentConditions(conditions);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("field and operator");
    });

    it("should reject invalid conditions (missing operator)", () => {
      const conditions = {
        conditions: [
          {
            field: "email",
            value: "test@example.com",
          },
        ],
        logic: "AND",
      };

      const result = validateSegmentConditions(conditions);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("field and operator");
    });

    it("should reject invalid format (not an object)", () => {
      const result = validateSegmentConditions("invalid");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("object");
    });

    it("should reject invalid format (no conditions or rules)", () => {
      const result = validateSegmentConditions({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain("'conditions' or 'rules'");
    });
  });
});

