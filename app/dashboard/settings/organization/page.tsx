/**
 * Organization Settings Page
 * Manage organization details and settings
 */

export const dynamic = 'force-dynamic';

import { getOrganization } from "@/app/actions/organizations";
import { getLanguages } from "@/app/actions/languages";
import { OrganizationSettingsClient } from "./OrganizationSettingsClient";
import { redirect } from "next/navigation";

export default async function OrganizationSettingsPage() {
  const [orgResult, languagesResult] = await Promise.all([
    getOrganization(),
    getLanguages(),
  ]);

  if (!orgResult.success || !orgResult.organization) {
    redirect("/dashboard");
  }

  const languages = languagesResult.success ? languagesResult.languages : [];

  return (
    <OrganizationSettingsClient
      organization={orgResult.organization}
      languages={languages}
    />
  );
}

