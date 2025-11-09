/**
 * Variable Parser
 * Extracts, validates, and replaces variables in email templates
 */

export interface VariableInfo {
  name: string;
  fullMatch: string;
  defaultValue?: string;
  filters?: string[];
}

/**
 * Extract all variables from a string or structure
 * Supports: {{variable}}, {{variable|default:"value"}}, {{variable|filter1|filter2}}
 */
export function extractVariables(input: string | object): VariableInfo[] {
  const text = typeof input === "string" ? input : JSON.stringify(input);
  const variables: VariableInfo[] = [];
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  let match;
  while ((match = variableRegex.exec(text)) !== null) {
    const fullMatch = match[0]; // {{variable|default:"value"|filter}}
    const content = match[1].trim(); // variable|default:"value"|filter
    
    // Parse variable name, default value, and filters
    const parts = content.split("|").map(p => p.trim());
    const variableName = parts[0];
    
    let defaultValue: string | undefined;
    const filters: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('default:')) {
        // Extract default value (remove quotes if present)
        defaultValue = part.substring(8).trim().replace(/^["']|["']$/g, "");
      } else {
        filters.push(part);
      }
    }
    
    variables.push({
      name: variableName,
      fullMatch,
      defaultValue,
      filters: filters.length > 0 ? filters : undefined,
    });
  }
  
  // Remove duplicates
  const unique = new Map<string, VariableInfo>();
  variables.forEach(v => {
    const key = v.name + (v.defaultValue ? `|default:${v.defaultValue}` : "");
    if (!unique.has(key)) {
      unique.set(key, v);
    }
  });
  
  return Array.from(unique.values());
}

/**
 * Validate that all variables exist in available variables
 */
export function validateVariables(
  variables: VariableInfo[],
  availableVars: Record<string, any>
): { valid: VariableInfo[]; invalid: VariableInfo[] } {
  const valid: VariableInfo[] = [];
  const invalid: VariableInfo[] = [];
  
  variables.forEach(variable => {
    const pathParts = variable.name.split(".");
    let current = availableVars;
    
    for (const part of pathParts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        invalid.push(variable);
        return;
      }
    }
    
    valid.push(variable);
  });
  
  return { valid, invalid };
}

/**
 * Replace variables in text with actual values
 */
export function replaceVariables(
  text: string,
  data: Record<string, any>,
  options?: {
    defaultEmpty?: boolean;
    handleMissing?: (variable: string) => string;
  }
): string {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  return text.replace(variableRegex, (match, content) => {
    const parts = content.trim().split("|").map((p: string) => p.trim());
    const variableName = parts[0];
    
    // Get value from data
    let value = getNestedValue(data, variableName);
    
    // Handle default value
    let defaultValue: string | undefined;
    const filters: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('default:')) {
        defaultValue = part.substring(8).trim().replace(/^["']|["']$/g, "");
      } else {
        filters.push(part);
      }
    }
    
    // Use default if value is missing
    if (value === undefined || value === null) {
      value = defaultValue !== undefined ? defaultValue : (options?.handleMissing?.(variableName) || "");
    }
    
    // Convert to string
    let result = value === null || value === undefined ? "" : String(value);
    
    // Apply filters
    if (filters.length > 0) {
      result = applyFilters(result, filters);
    }
    
    return result;
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    // Handle array access like items[0]
    if (part.includes("[")) {
      const [key, indexStr] = part.split("[");
      const index = parseInt(indexStr.replace("]", ""), 10);
      current = current?.[key]?.[index];
    } else {
      current = current?.[part];
    }
    
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Apply filters to a value
 */
function applyFilters(value: string, filters: string[]): string {
  let result = value;
  
  for (const filter of filters) {
    switch (filter.toLowerCase()) {
      case "uppercase":
      case "upper":
        result = result.toUpperCase();
        break;
      
      case "lowercase":
      case "lower":
        result = result.toLowerCase();
        break;
      
      case "capitalize":
        result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
        break;
      
      case "trim":
        result = result.trim();
        break;
      
      default:
        if (filter.startsWith("currency")) {
          // currency:USD or currency
          const currency = filter.includes(":") ? filter.split(":")[1] : "USD";
          const num = parseFloat(result);
          if (!isNaN(num)) {
            result = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: currency,
            }).format(num);
          }
        } else if (filter.startsWith("date")) {
          // date:format or date
          const format = filter.includes(":") ? filter.split(":")[1] : "short";
          const date = new Date(result);
          if (!isNaN(date.getTime())) {
            switch (format) {
              case "short":
                result = date.toLocaleDateString();
                break;
              case "long":
                result = date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                break;
              case "time":
                result = date.toLocaleTimeString();
                break;
              default:
                result = date.toLocaleString();
            }
          }
        } else if (filter.startsWith("length")) {
          // length or length:max
          result = String(result.length);
        }
        break;
    }
  }
  
  return result;
}

/**
 * Parse default value from variable string
 */
export function parseDefaultValue(variable: string): string | undefined {
  const match = variable.match(/default:\s*["']?([^"']+)["']?/);
  return match ? match[1] : undefined;
}

/**
 * Extract variable name from full variable string
 */
export function extractVariableName(variable: string): string {
  // Remove {{ }} and extract first part before |
  const content = variable.replace(/[{}]/g, "").trim();
  const parts = content.split("|");
  return parts[0].trim();
}

