"use client";

import { CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DASHBOARD_RETRACTION_BADGE_ACTIVE,
  DASHBOARD_RETRACTION_BADGE_PENDING,
} from "@/lib/dashboard/copy";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { ChronologieSection } from "./chronologie-section";
import { ComptableOnboardingForm } from "./comptable-onboarding-form";
import { OnboardingComptableWizard } from "./onboarding-comptable-wizard";
import { RetractionWaiverCard } from "./retraction-waiver-card";

type DashboardComptableProps = {
  data: DashboardData;
  onRefresh?: () => void;
  onOnboardingComplete?: () => void;
};

function offerLabel(offerType: string | null | undefined): string {
  if (offerType === "starter_999_5") return "Hercule Starter — 999 € TTC";
  if (offerType === "pack_3x1499") return "Pack 3 mois Croissance — 3 598 € TTC";
  return "Formule Croissance — 1 499 €/mois";
}

export function DashboardComptable({
  data,
  onRefresh,
  onOnboardingComplete,
}: DashboardComptableProps) {
  const displayName = data.firstName ?? data.company ?? "votre cabinet";
  const offerType = data.comptable?.offerType ?? data.offerType;

  if (data.dashboardMode === "comptable_pending") {
    return (
      <OnboardingComptableWizard
        slug={data.slug}
        firstName={data.firstName}
        company={data.company}
      />
    );
  }

  if (data.dashboardMode === "comptable_onboarding") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DashboardBrandHeader />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <DashboardPageHeader
            eyebrow="Espace cabinet"
            title={`Bienvenue, ${displayName}`}
            subtitle="Confirmez votre onboarding pour finaliser votre accès."
          />
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Onboarding cabinet</CardTitle>
            </CardHeader>
            <CardContent>
              <ComptableOnboardingForm
                data={data}
                onSuccess={() => onOnboardingComplete?.()}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const chronologieSteps = (data.milestones ?? data.timeline).map((step) => ({
    id: step.id,
    label: step.label,
    meta: step.meta,
    status: step.status,
  }));

  const retractionPending = data.retraction?.status === "pending";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardBrandHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <DashboardPageHeader
          eyebrow="Espace cabinet"
          title={`Bienvenue, ${displayName}`}
          subtitle={
            retractionPending
              ? "Votre onboarding est enregistré — activation en attente."
              : "Votre accès Hercule Comptable est actif."
          }
        />

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={
              retractionPending
                ? "border-amber-500/35 text-amber-400"
                : "border-emerald-500/35 text-emerald-400"
            }
          >
            {retractionPending
              ? DASHBOARD_RETRACTION_BADGE_PENDING
              : DASHBOARD_RETRACTION_BADGE_ACTIVE}
          </Badge>
        </div>

        {chronologieSteps.length > 0 ? (
          <div className="mt-8">
            <ChronologieSection
              steps={chronologieSteps}
              description="Estimations basées sur votre délai de rétractation et votre activation."
            />
          </div>
        ) : null}

        <RetractionWaiverCard data={data} onSuccess={onRefresh} />

        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Paiement confirmé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Formule souscrite :{" "}
                <span className="text-foreground font-medium">{offerLabel(offerType)}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-muted-foreground" />
                Prochaines étapes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>L&apos;équipe Hercule configure votre espace dans les 48 heures :</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Provisionnement de votre compte Calendly Pro</li>
                <li>Provisionnement de votre compte Zoom Pro</li>
                <li>Premier rendez-vous PME planifié sous 15 jours</li>
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
      </main>
    </div>
  );
}
