import { getTemplates } from "@/app/actions/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Copy, Eye } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { TemplatesPageClient } from "@/components/templates/TemplatesPageClient";

export default async function TemplatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getTemplates({ page: 1, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      <TemplatesPageClient initialTemplates={result.templates || []} total={result.total || 0} />
    </div>
  );
}
