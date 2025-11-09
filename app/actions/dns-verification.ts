"use server";

import { verifyDNS, checkSPF, checkDKIM, checkDMARC } from "@/lib/email/dns-verification";

/**
 * Verify DNS records for a domain
 */
export async function verifyDNSAction(
  emailOrDomain: string,
  dkimSelector?: string
) {
  try {
    const result = await verifyDNS(emailOrDomain, dkimSelector);
    return { success: true, result };
  } catch (error) {
    console.error("DNS verification error:", error);
    return { error: "Failed to verify DNS records" };
  }
}

/**
 * Check SPF record
 */
export async function checkSPFAction(domain: string) {
  try {
    const result = await checkSPF(domain);
    return { success: true, result };
  } catch (error) {
    console.error("SPF check error:", error);
    return { error: "Failed to check SPF record" };
  }
}

/**
 * Check DKIM record
 */
export async function checkDKIMAction(domain: string, selector?: string) {
  try {
    const result = await checkDKIM(domain, selector);
    return { success: true, result };
  } catch (error) {
    console.error("DKIM check error:", error);
    return { error: "Failed to check DKIM record" };
  }
}

/**
 * Check DMARC record
 */
export async function checkDMARCAction(domain: string) {
  try {
    const result = await checkDMARC(domain);
    return { success: true, result };
  } catch (error) {
    console.error("DMARC check error:", error);
    return { error: "Failed to check DMARC record" };
  }
}

