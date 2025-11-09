/**
 * CSV Import Service
 * Parse and validate CSV files for campaign recipients
 */

import Papa from "papaparse";

export interface CSVRecipient {
  email: string;
  name?: string;
  variables?: Record<string, any>;
}

export interface CSVImportResult {
  recipients: CSVRecipient[];
  errors: Array<{ row: number; error: string }>;
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

/**
 * Validate email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Parse CSV file
 */
export async function parseCSVFile(
  file: File | string
): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    const recipients: CSVRecipient[] = [];
    const errors: Array<{ row: number; error: string }> = [];
    let totalRows = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        totalRows = results.data.length;

        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // +2 because header is row 1, and index is 0-based

          // Find email column (case-insensitive)
          const emailKey = Object.keys(row).find(
            (key) => key.toLowerCase() === "email" || key.toLowerCase() === "e-mail"
          );

          if (!emailKey || !row[emailKey]) {
            errors.push({
              row: rowNumber,
              error: "Email column not found or empty",
            });
            return;
          }

          const email = String(row[emailKey]).trim();

          if (!isValidEmail(email)) {
            errors.push({
              row: rowNumber,
              error: `Invalid email address: ${email}`,
            });
            return;
          }

          // Build recipient object
          const recipient: CSVRecipient = {
            email,
          };

          // Find name column (case-insensitive)
          const nameKey = Object.keys(row).find(
            (key) =>
              key.toLowerCase() === "name" ||
              key.toLowerCase() === "fullname" ||
              key.toLowerCase() === "full_name"
          );
          if (nameKey && row[nameKey]) {
            recipient.name = String(row[nameKey]).trim();
          }

          // Collect all other columns as variables
          const variables: Record<string, any> = {};
          Object.keys(row).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey !== "email" &&
              lowerKey !== "e-mail" &&
              lowerKey !== "name" &&
              lowerKey !== "fullname" &&
              lowerKey !== "full_name" &&
              row[key]
            ) {
              // Clean variable name (remove spaces, special chars)
              const varName = key
                .trim()
                .replace(/[^a-zA-Z0-9_]/g, "_")
                .replace(/^[0-9]/, "_$&"); // Can't start with number
              variables[varName] = String(row[key]).trim();
            }
          });

          if (Object.keys(variables).length > 0) {
            recipient.variables = variables;
          }

          recipients.push(recipient);
        });

        resolve({
          recipients,
          errors,
          totalRows,
          validRows: recipients.length,
          invalidRows: errors.length,
        });
      },
      error: (error) => {
        resolve({
          recipients: [],
          errors: [{ row: 0, error: error.message }],
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
        });
      },
    });
  });
}

/**
 * Parse CSV string
 */
export async function parseCSVString(csvString: string): Promise<CSVImportResult> {
  return parseCSVFile(csvString);
}

/**
 * Detect duplicate emails in recipients list
 */
export function detectDuplicates(
  recipients: CSVRecipient[]
): Array<{ email: string; count: number }> {
  const emailCounts = new Map<string, number>();

  recipients.forEach((recipient) => {
    const email = recipient.email.toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  });

  const duplicates: Array<{ email: string; count: number }> = [];
  emailCounts.forEach((count, email) => {
    if (count > 1) {
      duplicates.push({ email, count });
    }
  });

  return duplicates;
}

/**
 * Remove duplicate emails (keeps first occurrence)
 */
export function removeDuplicates(recipients: CSVRecipient[]): CSVRecipient[] {
  const seen = new Set<string>();
  const unique: CSVRecipient[] = [];

  recipients.forEach((recipient) => {
    const email = recipient.email.toLowerCase();
    if (!seen.has(email)) {
      seen.add(email);
      unique.push(recipient);
    }
  });

  return unique;
}

