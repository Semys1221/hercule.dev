"use client";

import { CheckCircle2, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";

type DashboardComptableProps = {
  slug: string;
  isPaid: boolean;
  firstName: string | null;
  company: string | null;
  offerType: string | null;
};

function offerLabel(offerType: string | null): string {
  if (offerType === "pack_3x1499") return "Pack 3 mois — 3 598 € TTC";
  return "Mensuel — 1 499 €/mois";
}

export function DashboardComptable({
  slug,
  isPaid,
  firstName,
  company,
  offerType,
}: DashboardComptableProps) {
  const displayName = firstName ?? company ?? "votre cabinet";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardBrandHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        {isPaid ? (
          <>
            <DashboardPageHeader
              eyebrow="Espace cabinet"
              title={`Bienvenue, ${displayName}`}
              subtitle="Votre accès Hercule Comptable est actif."
            />

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Paiement confirmé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Formule souscrite : <span className="text-foreground font-medium">{offerLabel(offerType)}</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4 text-zinc-400" />
                    Prochaines étapes
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <p>
                    L&apos;équipe Hercule configure votre espace dans les 48 heures :
                  </p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>Provisionnement de votre compte Calendly Pro</li>
                    <li>Provisionnement de votre compte Zoom Pro</li>
                    <li>Premier rendez-vous TPE planifié sous 15 jours</li>
                  </ul>
                  <Separator className="my-2" />
                  <p>
                    Une question ? Contactez-nous à{" "}
                    <a
                      href="mailto:contact@hercule.dev"
                      className="text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      contact@hercule.dev
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <DashboardPageHeader
              eyebrow="Espace cabinet"
              title="Finaliser votre accès"
              subtitle="Sélectionnez votre formule et finalisez le paiement pour activer Hercule Comptable."
            />
            <StepEmbeddedCheckoutComptable slug={slug} />
          </>
        )}
      </main>
    </div>
  );
}
