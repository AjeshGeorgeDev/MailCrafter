/**
 * DNS Verification Page
 * Check SPF, DKIM, and DMARC records for email domains
 */

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DNSVerificationClient } from "./DNSVerificationClient";
import { redirect } from "next/navigation";

export default async function DNSCheckPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Verify prisma is available
  if (!prisma) {
    console.error("Prisma client is not available. Please run 'npx prisma generate'");
    throw new Error("Database connection not available");
  }

  // Get user's organization and SMTP profiles
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: {
      organization: true,
    },
  });

  if (!orgMember?.organization) {
    redirect("/dashboard");
  }

  // Get SMTP profiles to extract domains
  const smtpProfiles = await prisma.smtpProfile.findMany({
    where: {
      organizationId: orgMember.organization.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      fromEmail: true,
    },
  });

  const domains = Array.from(
    new Set(
      smtpProfiles.map((profile) => {
        const email = profile.fromEmail;
        return email.split("@")[1];
      })
    )
  );

  return <DNSVerificationClient initialDomains={domains} />;
}

