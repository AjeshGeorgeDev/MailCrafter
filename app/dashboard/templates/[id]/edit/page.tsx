import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getTemplateById } from "@/app/actions/templates";
import { NewEmailBuilder } from "@/components/templates/NewEmailBuilder";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";

interface EditTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Await params in Next.js 16+
  const { id } = await params;
  const result = await getTemplateById(id);

  if (!result.success || result.error) {
    redirect("/dashboard/templates");
  }

  const template = result.template;

  // Get all structures from TemplateLanguage table
  const { getAllTemplateLanguages } = await import("@/lib/templates/template-language-helpers");
  const allStructures = await getAllTemplateLanguages(id);
  
  // Get initial structure for default language - deep copy
  const defaultLang = template.defaultLanguage || "en";
  const defaultLangStructure = allStructures[defaultLang] || Object.values(allStructures)[0];
  
  // Debug logging
  console.log("[EditTemplatePage] Template ID:", id);
  console.log("[EditTemplatePage] Default language:", defaultLang);
  console.log("[EditTemplatePage] All structures keys:", Object.keys(allStructures));
  console.log("[EditTemplatePage] Default lang structure exists:", !!allStructures[defaultLang]);
  console.log("[EditTemplatePage] Default lang structure:", allStructures[defaultLang] ? "exists" : "missing");
  
  const initialStructure = defaultLangStructure ? JSON.parse(JSON.stringify(defaultLangStructure)) : null;
  
  if (!initialStructure) {
    console.warn("[EditTemplatePage] No initial structure found! Template may appear empty.");
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/templates">Templates</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{template.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* New Email Builder */}
      <NewEmailBuilder
        templateId={id}
        initialStructure={initialStructure}
        templateName={template.name}
        defaultLanguage={template.defaultLanguage}
        allStructures={allStructures}
      />
    </div>
  );
}

