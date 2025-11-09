/**
 * Variable Renderer
 * Processes conditionals and loops in email templates
 */

import { replaceVariables } from "./variable-parser";

export interface RenderContext {
  data: Record<string, any>;
  parent?: RenderContext;
}

/**
 * Render template with variables, conditionals, and loops
 */
export function renderTemplate(
  template: string,
  data: Record<string, any>
): string {
  let result = template;
  
  // Process loops first (they can contain conditionals)
  result = processLoops(result, data);
  
  // Process conditionals
  result = processConditionals(result, data);
  
  // Replace simple variables
  result = replaceVariables(result, data);
  
  return result;
}

/**
 * Process {{#each}}...{{/each}} loops
 */
function processLoops(template: string, data: Record<string, any>): string {
  const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  
  return template.replace(loopRegex, (match, variableName, content) => {
    const array = getNestedValue(data, variableName.trim());
    
    if (!Array.isArray(array) || array.length === 0) {
      return "";
    }
    
    // Render content for each item
    return array.map((item, index) => {
      // Create context with item data
      const itemData = {
        ...data,
        ...item,
        "@index": index,
        "@first": index === 0,
        "@last": index === array.length - 1,
        "@length": array.length,
      };
      
      // Process nested loops and conditionals
      let itemContent = content;
      itemContent = processLoops(itemContent, itemData);
      itemContent = processConditionals(itemContent, itemData);
      itemContent = replaceVariables(itemContent, itemData);
      
      return itemContent;
    }).join("");
  });
}

/**
 * Process {{#if}}...{{/if}} conditionals
 */
function processConditionals(template: string, data: Record<string, any>): string {
  const ifRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
  
  return template.replace(ifRegex, (match, condition, trueContent, falseContent) => {
    const conditionValue = evaluateCondition(condition.trim(), data);
    
    if (conditionValue) {
      // Process nested conditionals and variables
      let result = trueContent || "";
      result = processConditionals(result, data);
      result = processLoops(result, data);
      result = replaceVariables(result, data);
      return result;
    } else {
      // Process else block if present
      let result = falseContent || "";
      result = processConditionals(result, data);
      result = processLoops(result, data);
      result = replaceVariables(result, data);
      return result;
    }
  });
}

/**
 * Evaluate conditional expression
 */
function evaluateCondition(condition: string, data: Record<string, any>): boolean {
  // Handle simple variable checks
  if (!condition.includes(" ")) {
    const value = getNestedValue(data, condition);
    return value !== undefined && value !== null && value !== false && value !== "";
  }
  
  // Handle comparison operators: ==, !=, >, <, >=, <=
  const operators = [
    { op: "!=", check: (a: any, b: any) => a != b },
    { op: "==", check: (a: any, b: any) => a == b },
    { op: ">=", check: (a: any, b: any) => Number(a) >= Number(b) },
    { op: "<=", check: (a: any, b: any) => Number(a) <= Number(b) },
    { op: ">", check: (a: any, b: any) => Number(a) > Number(b) },
    { op: "<", check: (a: any, b: any) => Number(a) < Number(b) },
  ];
  
  for (const { op, check } of operators) {
    if (condition.includes(op)) {
      const [left, right] = condition.split(op).map(s => s.trim());
      const leftValue = getNestedValue(data, left) ?? left.replace(/^["']|["']$/g, "");
      const rightValue = getNestedValue(data, right) ?? right.replace(/^["']|["']$/g, "");
      return check(leftValue, rightValue);
    }
  }
  
  // Handle negation
  if (condition.startsWith("!")) {
    const varName = condition.substring(1).trim();
    const value = getNestedValue(data, varName);
    return !value || value === false || value === "";
  }
  
  return false;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  // Handle array access like items[0]
  if (path.includes("[")) {
    const [basePath, indexStr] = path.split("[");
    const index = parseInt(indexStr.replace("]", ""), 10);
    const baseValue = getNestedValue(obj, basePath);
    return Array.isArray(baseValue) ? baseValue[index] : undefined;
  }
  
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Process nested blocks (conditionals inside loops, etc.)
 */
export function processNestedBlocks(
  template: string,
  data: Record<string, any>,
  context?: RenderContext
): string {
  let result = template;
  
  // Process loops first (they can contain conditionals)
  result = processLoops(result, data);
  
  // Process conditionals
  result = processConditionals(result, data);
  
  return result;
}

