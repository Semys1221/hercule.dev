"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";
import { cn } from "@/lib/utils";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepPricingCardComptable } from "./steps/step-pricing-card-comptable";

const STEP_COUNT = 3;

type OnboardingComptableWizardProps = {
  slug: string;
  firstName: string | null;
  company: string | null;
};

export function OnboardingComptableWizard({
  slug,
  firstName,
  company,
}: OnboardingComptableWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable>(
    OFFER_TYPES_COMPTABLE.monthly1499,
  );
  const [tieDownAccepted, setTieDownAccepted] = useState(false);
  const progressValue = ((step + 1) / STEP_COUNT) * 100;

  const greeting = firstName || "Bonjour";
  const prospectLine = company ? `${greeting} · ${company}` : greeting;

  const isFaqStep = step === 0;
  const isPricingStep = step === 1;
  const isCheckoutStep = step === 2;
  const canGoNext = !isFaqStep || tieDownAccepted;

  const persistTieDown = useCallback(async () => {
    await fetch(`/api/dashboard/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tieDownAccepted: true }),
    });
  }, [slug]);

  function goNext() {
    if (isFaqStep && tieDownAccepted) {
      void persistTieDown();
    }
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }

  function goPrev() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-background text-foreground",
        isCheckoutStep ? "pb-12" : "pb-20",
      )}
    >
      <DashboardBrandHeader />

      <main
        className={cn(
          "mx-auto px-6 pt-10",
          isCheckoutStep ? "max-w-5xl" : "max-w-3xl",
        )}
      >
        <DashboardPageHeader
          eyebrow="Espace cabinet"
          title="Finaliser votre accès"
          subtitle={prospectLine}
        />

        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <span>
                Étape {step + 1} sur {STEP_COUNT}
              </span>
            </div>
            <Progress value={progressValue} />
          </div>

          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-card",
              isCheckoutStep ? "min-h-[720px] p-4" : "min-h-[360px] p-6",
            )}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {step === 0 && (
                  <StepFaqTieDown
                    audience="comptable"
                    tieDownId="tie-down-comptable"
                    tieDownAccepted={tieDownAccepted}
                    onTieDownChange={setTieDownAccepted}
                  />
                )}
                {step === 1 && (
                  <StepPricingCardComptable
                    selectedOffer={selectedOffer}
                    onSelectOffer={setSelectedOffer}
                    onProceed={goNext}
                  />
                )}
                {step === 2 && (
                  <StepEmbeddedCheckoutComptable
                    slug={slug}
                    selectedOffer={selectedOffer}
                    startImmediately
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {!isCheckoutStep && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={step === 0}
              >
                Précédent
              </Button>
              <div className="ml-auto flex flex-wrap items-center gap-3">
                {!isPricingStep && (
                  <Button type="button" onClick={goNext} disabled={!canGoNext}>
                    Suivant
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
