/**
 * DNS Verification Service
 * Check SPF, DKIM, and DMARC records for email domains
 */

import { promises as dns } from "dns";

export interface SPFRecord {
  exists: boolean;
  record?: string;
  valid: boolean;
  errors?: string[];
}

export interface DKIMRecord {
  exists: boolean;
  record?: string;
  valid: boolean;
  selector?: string;
  errors?: string[];
}

export interface DMARCRecord {
  exists: boolean;
  record?: string;
  valid: boolean;
  policy?: string;
  errors?: string[];
}

export interface DNSVerificationResult {
  domain: string;
  spf: SPFRecord;
  dkim: DKIMRecord;
  dmarc: DMARCRecord;
  overall: "valid" | "partial" | "invalid";
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
  return email.split("@")[1] || email;
}

/**
 * Check SPF record
 */
export async function checkSPF(domain: string): Promise<SPFRecord> {
  try {
    const records = await dns.resolveTxt(domain);
    const spfRecord = records
      .flat()
      .find((record) => record.startsWith("v=spf1"));

    if (!spfRecord) {
      return {
        exists: false,
        valid: false,
        errors: ["No SPF record found"],
      };
    }

    // Basic validation
    const errors: string[] = [];
    if (!spfRecord.includes("include:")) {
      errors.push("SPF record should include other SPF records");
    }

    return {
      exists: true,
      record: spfRecord,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      exists: false,
      valid: false,
      errors: [error.message || "Failed to check SPF record"],
    };
  }
}

/**
 * Check DKIM record
 */
export async function checkDKIM(
  domain: string,
  selector: string = "default"
): Promise<DKIMRecord> {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const records = await dns.resolveTxt(dkimDomain);

    if (records.length === 0) {
      return {
        exists: false,
        valid: false,
        selector,
        errors: [`No DKIM record found for selector: ${selector}`],
      };
    }

    const dkimRecord = records.flat().join("");
    const errors: string[] = [];

    if (!dkimRecord.includes("v=DKIM1")) {
      errors.push("Invalid DKIM record format");
    }

    return {
      exists: true,
      record: dkimRecord,
      valid: errors.length === 0,
      selector,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      exists: false,
      valid: false,
      selector,
      errors: [error.message || "Failed to check DKIM record"],
    };
  }
}

/**
 * Check DMARC record
 */
export async function checkDMARC(domain: string): Promise<DMARCRecord> {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const records = await dns.resolveTxt(dmarcDomain);

    if (records.length === 0) {
      return {
        exists: false,
        valid: false,
        errors: ["No DMARC record found"],
      };
    }

    const dmarcRecord = records.flat().join("");
    const errors: string[] = [];
    let policy: string | undefined;

    // Extract policy
    const policyMatch = dmarcRecord.match(/p=([^;]+)/);
    if (policyMatch) {
      policy = policyMatch[1];
    } else {
      errors.push("DMARC record missing policy (p=)");
    }

    if (!dmarcRecord.includes("v=DMARC1")) {
      errors.push("Invalid DMARC record format");
    }

    return {
      exists: true,
      record: dmarcRecord,
      valid: errors.length === 0,
      policy,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      exists: false,
      valid: false,
      errors: [error.message || "Failed to check DMARC record"],
    };
  }
}

/**
 * Verify all DNS records for a domain
 */
export async function verifyDNS(
  emailOrDomain: string,
  dkimSelector?: string
): Promise<DNSVerificationResult> {
  const domain = extractDomain(emailOrDomain);

  const [spf, dkim, dmarc] = await Promise.all([
    checkSPF(domain),
    checkDKIM(domain, dkimSelector),
    checkDMARC(domain),
  ]);

  // Determine overall status
  let overall: "valid" | "partial" | "invalid" = "invalid";
  const validCount = [spf.valid, dkim.valid, dmarc.valid].filter(Boolean).length;

  if (validCount === 3) {
    overall = "valid";
  } else if (validCount > 0) {
    overall = "partial";
  }

  return {
    domain,
    spf,
    dkim,
    dmarc,
    overall,
  };
}

