/**
 * Segment Condition Evaluator
 * Evaluates whether a contact matches segment conditions
 */

import type { Contact, ContactStatus } from "@prisma/client";

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

export interface SegmentConditions {
  rules?: SegmentRule[];
  conditions?: SegmentCondition[];
  logic?: "AND" | "OR";
}

/**
 * Evaluate a single condition against a contact
 */
function evaluateCondition(contact: Contact, condition: SegmentCondition): boolean {
  const { field, operator, value } = condition;

  // Get field value from contact
  let fieldValue: any;

  switch (field) {
    case "email":
      fieldValue = contact.email;
      break;
    case "firstName":
      fieldValue = contact.firstName || "";
      break;
    case "lastName":
      fieldValue = contact.lastName || "";
      break;
    case "status":
      fieldValue = contact.status;
      break;
    case "subscribedAt":
      fieldValue = contact.subscribedAt;
      break;
    default:
      // Check custom fields
      if (contact.customFields && typeof contact.customFields === "object") {
        const customFields = contact.customFields as Record<string, any>;
        fieldValue = customFields[field];
      } else {
        fieldValue = null;
      }
  }

  // Handle null/undefined values
  if (fieldValue === null || fieldValue === undefined) {
    return operator === "isNot" && value === null;
  }

  // Evaluate based on operator
  switch (operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();
    
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    
    case "startsWith":
      return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
    
    case "endsWith":
      return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
    
    case "greaterThan":
      return Number(fieldValue) > Number(value);
    
    case "lessThan":
      return Number(fieldValue) < Number(value);
    
    case "is":
      if (field === "status") {
        return fieldValue === value;
      }
      return fieldValue === value || String(fieldValue).toLowerCase() === String(value).toLowerCase();
    
    case "isNot":
      if (field === "status") {
        return fieldValue !== value;
      }
      return fieldValue !== value && String(fieldValue).toLowerCase() !== String(value).toLowerCase();
    
    case "in":
      if (Array.isArray(value)) {
        return value.some((v) => String(fieldValue).toLowerCase() === String(v).toLowerCase());
      }
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();
    
    case "notIn":
      if (Array.isArray(value)) {
        return !value.some((v) => String(fieldValue).toLowerCase() === String(v).toLowerCase());
      }
      return String(fieldValue).toLowerCase() !== String(value).toLowerCase();
    
    default:
      return false;
  }
}

/**
 * Evaluate a rule (group of conditions) against a contact
 */
function evaluateRule(contact: Contact, rule: SegmentRule): boolean {
  const { conditions, logic = "AND" } = rule;

  if (conditions.length === 0) {
    return true;
  }

  if (logic === "OR") {
    return conditions.some((condition) => evaluateCondition(contact, condition));
  } else {
    // AND logic (default)
    return conditions.every((condition) => evaluateCondition(contact, condition));
  }
}

/**
 * Evaluate segment conditions against a contact
 */
export function evaluateSegmentConditions(
  contact: Contact,
  segmentConditions: SegmentConditions
): boolean {
  // Handle legacy format (direct conditions array)
  if (segmentConditions.conditions && !segmentConditions.rules) {
    const { conditions, logic = "AND" } = segmentConditions;
    
    if (conditions.length === 0) {
      return true;
    }

    if (logic === "OR") {
      return conditions.some((condition) => evaluateCondition(contact, condition));
    } else {
      return conditions.every((condition) => evaluateCondition(contact, condition));
    }
  }

  // Handle rules format (groups of conditions)
  if (segmentConditions.rules) {
    const { rules, logic = "AND" } = segmentConditions;

    if (rules.length === 0) {
      return true;
    }

    if (logic === "OR") {
      return rules.some((rule) => evaluateRule(contact, rule));
    } else {
      // AND logic (default)
      return rules.every((rule) => evaluateRule(contact, rule));
    }
  }

  // No conditions = match all
  return true;
}

/**
 * Validate segment conditions structure
 */
export function validateSegmentConditions(conditions: any): { valid: boolean; error?: string } {
  try {
    if (!conditions || typeof conditions !== "object") {
      return { valid: false, error: "Conditions must be an object" };
    }

    // Check for legacy format
    if (conditions.conditions && Array.isArray(conditions.conditions)) {
      for (const condition of conditions.conditions) {
        if (!condition.field || !condition.operator) {
          return { valid: false, error: "Each condition must have field and operator" };
        }
      }
      return { valid: true };
    }

    // Check for rules format
    if (conditions.rules && Array.isArray(conditions.rules)) {
      for (const rule of conditions.rules) {
        if (!rule.conditions || !Array.isArray(rule.conditions)) {
          return { valid: false, error: "Each rule must have conditions array" };
        }
        for (const condition of rule.conditions) {
          if (!condition.field || !condition.operator) {
            return { valid: false, error: "Each condition must have field and operator" };
          }
        }
      }
      return { valid: true };
    }

    return { valid: false, error: "Conditions must have either 'conditions' or 'rules' array" };
  } catch (error) {
    return { valid: false, error: "Invalid conditions format" };
  }
}

