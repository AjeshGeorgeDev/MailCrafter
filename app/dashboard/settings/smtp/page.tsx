/**
 * SMTP Settings Page
 * Manage SMTP profiles for the organization
 */

export const dynamic = 'force-dynamic';

import { getSMTPProfiles } from "@/app/actions/smtp";
import { SMTPSettingsClient } from "./SMTPSettingsClient";

export default async function SMTPSettingsPage() {
  const result = await getSMTPProfiles();
  const profiles = result.profiles || [];

  return <SMTPSettingsClient initialProfiles={profiles} />;
}

