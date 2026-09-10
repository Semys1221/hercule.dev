"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";
import type { DashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { StepComptableOnboardingFormPreview } from "./steps/step-comptable-onboarding-form-preview";
import { StepDashboardPreviewComptable } from "./steps/step-dashboard-preview-comptable";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepPricingCardComptable } from "./steps/step-pricing-card-comptable";
import { StepScreenShare } from "./steps/step-screen-share";

const STEP_COUNT = 6;

type OnboardingComptableWizardProps = {
  data: DashboardData;
};

export function OnboardingComptableWizard({ data }: OnboardingComptableWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable>(
    OFFER_TYPES_COMPTABLE.monthly1499,
  );
  const [tieDownAccepted, setTieDownAccepted] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPreloadError, setCheckoutPreloadError] = useState<string | null>(null);
  const checkoutPreloadStartedRef = useRef(false);
  const progressValue = ((step + 1) / STEP_COUNT) * 100;

  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  const isFaqStep = step === 3;
  const isPricingStep = step === 4;
  const isCheckoutStep = step === 5;
  const canGoNext = !isFaqStep || tieDownAccepted;

  const persistTieDown = useCallback(async () => {
    await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tieDownAccepted: true }),
    });
  }, [data.slug]);

  const preloadCheckout = useCallback(async () => {
    if (checkoutPreloadStartedRef.current) {
      return;
    }
    checkoutPreloadStartedRef.current = true;

    try {
      const response = await fetch("/api/payments/checkout-comptable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: data.slug, offerType: selectedOffer }),
      });
      const body = (await response.json()) as { clientSecret?: string; error?: string };

      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "569fa6",
        },
        body: JSON.stringify({
          sessionId: "569fa6",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "onboarding-comptable-wizard.tsx:preloadCheckout",
          message: "checkout-comptable preload response",
          data: {
            ok: response.ok,
            status: response.status,
            hasClientSecret: Boolean(body.clientSecret),
            error: body.error ?? null,
            offerType: selectedOffer,
            slug: data.slug,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (!response.ok || !body.clientSecret) {
        checkoutPreloadStartedRef.current = false;
        setCheckoutPreloadError(body.error ?? "Paiement indisponible");
        setCheckoutClientSecret(null);
        return;
      }

      setCheckoutClientSecret(body.clientSecret);
      setCheckoutPreloadError(null);
    } catch {
      checkoutPreloadStartedRef.current = false;
      setCheckoutPreloadError("Paiement indisponible");
      setCheckoutClientSecret(null);
    }
  }, [data.slug, selectedOffer]);

  useEffect(() => {
    checkoutPreloadStartedRef.current = false;
    setCheckoutClientSecret(null);
    setCheckoutPreloadError(null);
  }, [data.slug, selectedOffer]);

  useEffect(() => {
    if (step < 4) {
      return;
    }

    void preloadCheckout();
  }, [step, preloadCheckout]);

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
                {step === 0 && <StepScreenShare />}
                {step === 1 && <StepDashboardPreviewComptable />}
                {step === 2 && <StepComptableOnboardingFormPreview />}
                {step === 3 && (
                  <StepFaqTieDown
                    audience="comptable"
                    tieDownId="tie-down-comptable"
                    tieDownAccepted={tieDownAccepted}
                    onTieDownChange={setTieDownAccepted}
                  />
                )}
                {step === 4 && (
                  <StepPricingCardComptable
                    selectedOffer={selectedOffer}
                    onSelectOffer={setSelectedOffer}
                    onProceed={goNext}
                  />
                )}
                {step === 5 && (
                  <StepEmbeddedCheckoutComptable
                    slug={data.slug}
                    selectedOffer={selectedOffer}
                    startImmediately
                    clientSecret={checkoutClientSecret}
                    preloadError={checkoutPreloadError}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {!isCheckoutStep && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={goPrev} disabled={step === 0}>
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
