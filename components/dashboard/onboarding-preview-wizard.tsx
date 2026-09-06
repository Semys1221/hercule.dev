"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { StepScreenShare } from "./steps/step-screen-share";
import { StepDashboardPreview } from "./steps/step-dashboard-preview";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepPricingCard } from "./steps/step-pricing-card";
import { StepEmbeddedCheckout } from "./steps/step-embedded-checkout";

// Step 2 — Onboarding form preview (greyed out, read-only)
function StepOnboardingFormPreview() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Onboarding — aperçu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce formulaire sera disponible après paiement pour configurer votre profil agence.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Spécialités · Zone · Capacité mensuelle · Budget minimum
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Disponible après activation
        </p>
      </div>
    </div>
  );
}

const STEP_COUNT = 6;

type OnboardingPreviewWizardProps = {
  data: DashboardData;
  onRefresh: () => void;
};

export function OnboardingPreviewWizard({
  data,
  onRefresh: _onRefresh,
}: OnboardingPreviewWizardProps) {
  const [step, setStep] = useState(0);
  const progressValue = ((step + 1) / STEP_COUNT) * 100;

  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  // Steps 0–3 are navigable with prev/next
  // Step 4 = pricing card (has its own "proceed" → step 5)
  // Step 5 = embedded checkout (no next, no prev)
  const isCheckoutStep = step === 5;
  const isPricingStep = step === 4;
  const isReadOnlyStep = step < 4;

  function goNext() {
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }

  function goPrev() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow="Suivi de votre livraison"
          title={`Commande #${data.slug.slice(0, 8).toUpperCase()}`}
          subtitle={prospectLine}
        />
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Étape {step + 1} sur {STEP_COUNT}</span>
            {isReadOnlyStep && (
              <span className="text-muted-foreground/60">Aperçu — paiement requis</span>
            )}
          </div>
          <Progress value={progressValue} />
        </div>

        <div className="min-h-[360px] overflow-hidden rounded-xl border border-border bg-card p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step === 0 && <StepScreenShare />}
              {step === 1 && <StepDashboardPreview />}
              {step === 2 && <StepOnboardingFormPreview />}
              {step === 3 && <StepFaqTieDown items={data.faq} />}
              {step === 4 && <StepPricingCard onProceed={goNext} />}
              {step === 5 && <StepEmbeddedCheckout slug={data.slug} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {!isCheckoutStep && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={step === 0}
            >
              Précédent
            </Button>
            <div className="ml-auto">
              {!isPricingStep && (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={step === STEP_COUNT - 1}
                >
                  Suivant
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
