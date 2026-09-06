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

const SECTIONS = [
  {
    href: "/internal/funnels",
    title: "Funnels",
    description:
      "Funnel Builder — sales, onboarding, légal, emails par audience agence/entreprise.",
    icon: TrendingUp,
    cta: "Ouvrir Funnels",
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
        title="Internal"
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
