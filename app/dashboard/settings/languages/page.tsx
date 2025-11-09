/**
 * Language Settings Page
 * Manage languages for the organization
 */

import { LanguagesPageClient } from "./LanguagesPageClient";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LanguagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user has admin permissions
  const { prisma } = await import("@/lib/db/prisma");
  const orgMember = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  const isAdmin = !!orgMember;

  // Fetch initial data
  const { getLanguages, getDefaultLanguage } = await import("@/app/actions/languages");
  const languagesResult = await getLanguages();
  const defaultLanguageResult = await getDefaultLanguage();

  const languages = languagesResult.success ? languagesResult.languages : [];
  const defaultLanguage =
    defaultLanguageResult.success
      ? defaultLanguageResult.defaultLanguage
      : "en";

  return (
    <LanguagesPageClient
      initialLanguages={languages}
      initialDefaultLanguage={defaultLanguage}
      isAdmin={isAdmin}
    />
  );
}

