import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { NewTemplateForm } from "@/components/templates/NewTemplateForm";

export default async function NewTemplatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
        <p className="text-muted-foreground">
          Start building your email template
        </p>
      </div>

      <NewTemplateForm />
    </div>
  );
}

