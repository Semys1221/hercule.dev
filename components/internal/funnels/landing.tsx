import Link from "next/link";

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
  AUDIENCE_CAPTIONS,
  AUDIENCE_ICONS,
  AUDIENCE_LABELS,
  type Audience,
} from "@/lib/admin/navigation";

const AUDIENCES: Audience[] = ["agence", "entreprise"];

export function FunnelLanding() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <InternalPageHeader
        title="Funnels"
        description="Cockpit interne — sélectionnez une audience pour accéder aux onglets Sales, Onboarding, Dashboard, CVG et Emails."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <Card key={audience}>
            <CardHeader>
              <CardTitle>
                {AUDIENCE_ICONS[audience]} {AUDIENCE_LABELS[audience]}
              </CardTitle>
              <CardDescription>{AUDIENCE_CAPTIONS[audience]}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/internal/funnels/${audience}`}>
                  Ouvrir {AUDIENCE_LABELS[audience]}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
