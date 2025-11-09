/**
 * New Campaign Wizard Page
 * Multi-step campaign creation wizard
 */

export const dynamic = 'force-dynamic';

import { getTemplates } from "@/app/actions/templates";
import { getSMTPProfiles } from "@/app/actions/smtp";
import { getDefaultLanguage } from "@/app/actions/languages";
import { CampaignWizardClient } from "./CampaignWizardClient";

export default async function NewCampaignPage() {
  // Fetch initial data
  const [templatesResult, smtpResult, defaultLangResult] = await Promise.all([
    getTemplates({ limit: 100 }),
    getSMTPProfiles(),
    getDefaultLanguage(),
  ]);

  const templates = templatesResult.templates || [];
  const smtpProfiles = smtpResult.profiles || [];
  const defaultLanguage =
    defaultLangResult.success && defaultLangResult.defaultLanguage
      ? defaultLangResult.defaultLanguage
      : "en";

  return (
    <CampaignWizardClient
      initialTemplates={templates}
      initialSMTPProfiles={smtpProfiles}
      defaultLanguage={defaultLanguage}
    />
  );
}

