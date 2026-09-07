import Link from "next/link";
import { Boxes, Database, TrendingUp } from "lucide-react";

import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ADMIN_ROOT_LABEL,
  LANDING_DESCRIPTION,
  PRODUCT_BUILDER_LABEL,
  PRODUCT_ROOT_LABEL,
} from "@/lib/admin/funnels/ui-copy";

const SECTIONS = [
  {
    href: "/internal/funnels",
    title: PRODUCT_ROOT_LABEL,
    description: LANDING_DESCRIPTION,
    icon: TrendingUp,
    cta: `Ouvrir ${PRODUCT_ROOT_LABEL}`,
  },
  {
    href: "/internal/components",
    title: "Composants",
    description:
      "Inventaire recipient / trigger / edition + orchestrateurs (API, webhooks, crons).",
    icon: Boxes,
    cta: "Voir les composants",
  },
  {
    href: "/internal/database",
    title: "Database",
    description:
      "Tables Supabase — writers, readers, colonnes clés et liens profile JSON.",
    icon: Database,
    cta: "Voir les tables",
  },
] as const;

export default function InternalHubPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <InternalPageHeader
        title={ADMIN_ROOT_LABEL}
        description="Documentation vivante de l'architecture Hercule — composants, base de données et outils ops."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="size-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={section.href}>{section.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
