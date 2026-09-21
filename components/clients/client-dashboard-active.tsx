"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { conferenceOfferLabel } from "@/lib/commercial/conference-pricing";
import {
  DASHBOARD_RETRACTION_BADGE_ACTIVE,
  DASHBOARD_RETRACTION_BADGE_PENDING,
} from "@/lib/legacy/dashboard/copy";
import { ChronologieSection } from "@/components/legacy/dashboard/chronologie-section";
import { DashboardBrandHeader, DashboardPageHeader } from "@/components/legacy/dashboard/brand-header";
import { PostPaymentFaqLink } from "@/components/legacy/dashboard/post-payment-faq-link";
import { StepFaq } from "@/components/legacy/dashboard/steps/step-faq";
import type { ClientDashboardData } from "@/lib/clients/types";

import { ClientCalendlyStatusCard } from "./client-calendly-status-card";
import { ClientNoShowDialog } from "./client-noshow-dialog";
import { ClientRdvCreditsCard } from "./client-rdv-credits-card";
import { ClientRetractionWaiverCard } from "./client-retraction-waiver-card";
import { ClientSubscriptionCard } from "./client-subscription-card";
import { ClientUpsellCard } from "./client-upsell-card";

type ClientDashboardActiveProps = {
  data: ClientDashboardData;
  onRefresh?: () => void;
};

export function ClientDashboardActive({ data, onRefresh }: ClientDashboardActiveProps) {
  const displayName = data.firstName ?? "Bonjour";
  const retractionPending = data.retraction?.status === "pending";
  const chronologieSteps = data.timeline.map((step) => ({
    id: step.id,
    label: step.label,
    meta: step.meta,
    status: step.status,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardBrandHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <DashboardPageHeader
          eyebrow={data.dashboardTitle}
          title={`Bienvenue, ${displayName}`}
          subtitle={data.dashboardDescription}
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
              description="Suivi de votre livraison — estimations indicatives."
            />
          </div>
        ) : null}

        <ClientRetractionWaiverCard data={data} onSuccess={onRefresh} />

        <div className="mt-6 flex flex-col gap-6">
          <ClientRdvCreditsCard data={data} />
          <ClientCalendlyStatusCard calendlySeat={data.calendlySeat} />
          <ClientSubscriptionCard data={data} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formule confirmée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {conferenceOfferLabel(data.offerType)}
              </p>
            </CardContent>
          </Card>

          <ClientUpsellCard />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signaler un problème</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Prospect absent au rendez-vous ou problème de livraison ?
              </p>
              <ClientNoShowDialog slug={data.slug} onSuccess={onRefresh} />
            </CardContent>
          </Card>

          {data.faq.length > 0 ? <StepFaq items={data.faq} /> : null}

          <Separator />

          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Une question ?{" "}
              <a
                href={`mailto:${data.contactEmail}`}
                className="text-foreground underline underline-offset-2 hover:no-underline"
              >
                {data.contactEmail}
              </a>
            </p>
            <PostPaymentFaqLink />
            <Button asChild variant="link" className="h-auto justify-start p-0">
              <Link href={data.upsellUrl}>Renouveler ou changer de formule</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
