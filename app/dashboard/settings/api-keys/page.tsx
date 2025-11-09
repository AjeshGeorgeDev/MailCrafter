import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ApiKeysSettings } from "@/components/settings/ApiKeysSettings";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">
          Manage API keys for programmatic access to your MailCrafter account
        </p>
      </div>

      <ApiKeysSettings />
    </div>
  );
}

