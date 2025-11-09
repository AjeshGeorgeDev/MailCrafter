import {
  Palette,
  Code,
  Languages,
  BarChart3,
  Send,
  Shield,
  Zap,
  Users,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Palette,
    title: "Drag & Drop Builder",
    description:
      "Create stunning email templates with our intuitive visual editor. No coding skills needed.",
  },
  {
    icon: Code,
    title: "Custom HTML/CSS",
    description:
      "Advanced users can customize templates with custom code for maximum flexibility.",
  },
  {
    icon: Languages,
    title: "Multi-Language Support",
    description:
      "Translate your templates into multiple languages and send localized campaigns.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track opens, clicks, conversions, and more with comprehensive analytics dashboard.",
  },
  {
    icon: Send,
    title: "Campaign Management",
    description:
      "Schedule, send, and manage email campaigns with advanced automation features.",
  },
  {
    icon: Shield,
    title: "Deliverability Focused",
    description:
      "Built-in SPF/DKIM/DMARC checks and bounce handling for maximum deliverability.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Queue-based email sending system ensures fast, reliable delivery at scale.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Work together with your team with role-based access control and permissions.",
  },
  {
    icon: FileText,
    title: "Template Library",
    description:
      "Access pre-built templates and snippets to speed up your email creation.",
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Powerful features to create, send, and track professional email campaigns
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

