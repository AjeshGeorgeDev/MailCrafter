/**
 * Team Management Page
 * Manage team members and their roles
 */

export const dynamic = 'force-dynamic';

import { getTeamMembers } from "@/app/actions/team";
import { TeamManagementClient } from "./TeamManagementClient";
import { redirect } from "next/navigation";

export default async function TeamManagementPage() {
  const result = await getTeamMembers();

  if (!result.success) {
    redirect("/dashboard");
  }

  return <TeamManagementClient initialMembers={result.members || []} />;
}

