"use client";

import { useState, useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSeedSlug } from "@/lib/admin/clients/seed";
import {
  DASHBOARD_DEV_COMPLETE_ONBOARDING_CTA,
  DASHBOARD_DEV_COMPLETE_ONBOARDING_ERROR,
  DASHBOARD_DEV_COMPLETE_ONBOARDING_LOADING,
} from "@/lib/admin/funnels/ui-copy";
import { DASHBOARD_EYEBROW, dashboardPageTitle } from "@/lib/dashboard/copy";
import {
  getDashboardDeveloperModeEnabledServerSnapshot,
  getDashboardDeveloperModeEnabledSnapshot,
  subscribeDashboardDeveloperModeEnabled,
} from "@/lib/dashboard/developer-mode";
import type { DashboardData } from "@/lib/dashboard/types";

import { ChronologieSection } from "./chronologie-section";
import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { PostPaymentFaqLink } from "./post-payment-faq-link";
import { CGV_VERSION } from "./onboarding-form-fields";
import { OnboardingFormModal } from "./onboarding-form-modal";

type DashboardStateProps = {
  data: DashboardData;
  onOnboardingComplete?: () => void;
};

function statusLabel(data: DashboardData): string {
  if (data.productStatut === "IN_DELIVERANCE") {
    return "Votre livraison est active";
  }
  if (data.onboardingCompleted) {
    return "Votre première livraison est en préparation";
  }
  return "Livraison en cours de démarrage";
}

function statusDetail(data: DashboardData): string {
  if (data.scheduledAt) {
    return `Rendez-vous confirmé le ${new Date(data.scheduledAt).toLocaleString("fr-FR")}`;
  }
  return "Suivi de votre parcours Hercule";
}

export function DashboardState({ data, onOnboardingComplete }: DashboardStateProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [devCompleteLoading, setDevCompleteLoading] = useState(false);
  const [devCompleteError, setDevCompleteError] = useState<string | null>(null);
  const developerModeEnabled = useSyncExternalStore(
    subscribeDashboardDeveloperModeEnabled,
    getDashboardDeveloperModeEnabledSnapshot,
    getDashboardDeveloperModeEnabledServerSnapshot,
  );
  const showDevOnboardingShortcut = developerModeEnabled && isSeedSlug(data.slug);
  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  async function completeOnboardingForTest() {
    setDevCompleteLoading(true);
    setDevCompleteError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: data.form,
          tieDownAccepted: true,
          completeOnboarding: true,
          cgvVersion: CGV_VERSION,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? DASHBOARD_DEV_COMPLETE_ONBOARDING_ERROR);
      }
      onOnboardingComplete?.();
    } catch (err) {
      setDevCompleteError(
        err instanceof Error ? err.message : DASHBOARD_DEV_COMPLETE_ONBOARDING_ERROR,
      );
    } finally {
      setDevCompleteLoading(false);
    }
  }

  const chronologieSteps = data.timeline.map((step) => ({
    id: step.id,
    label: step.label,
    meta: step.meta,
    status: step.status,
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow={DASHBOARD_EYEBROW}
          title={dashboardPageTitle(data.slug)}
          subtitle={prospectLine}
        />
      </div>

      <ChronologieSection
        steps={chronologieSteps}
        animated={false}
        description={`${statusLabel(data)} — ${statusDetail(data)}`}
        activeStatusLabel="En cours"
      />

      {/* Onboarding CTA — shown only when onboarding is not complete */}
      {!data.onboardingCompleted && (
        <Card className="mt-6 border-border">
          <CardHeader className="pb-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-amber-500/40 text-xs text-amber-400"
              >
                Action requise
              </Badge>
            </div>
            <CardTitle className="text-base font-semibold">
              Complétez votre onboarding
            </CardTitle>
            <CardDescription>
              Renseignez votre profil agence pour activer la recherche de contrats.
              Moins de 3 minutes.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-3">
            <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
              Compléter mon onboarding
            </Button>
            {showDevOnboardingShortcut ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void completeOnboardingForTest()}
                disabled={devCompleteLoading}
              >
                {devCompleteLoading
                  ? DASHBOARD_DEV_COMPLETE_ONBOARDING_LOADING
                  : DASHBOARD_DEV_COMPLETE_ONBOARDING_CTA}
              </Button>
            ) : null}
          </CardFooter>
          {devCompleteError ? (
            <p className="px-6 pb-4 text-sm text-destructive">{devCompleteError}</p>
          ) : null}
        </Card>
      )}

      <OnboardingFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        slug={data.slug}
        data={data}
        onSuccess={() => {
          onOnboardingComplete?.();
        }}
      />

      {data.isPaid ? <PostPaymentFaqLink /> : null}
    </div>
  );
}
