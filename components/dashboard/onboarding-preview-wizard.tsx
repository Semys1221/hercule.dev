"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DASHBOARD_DEV_SKIP_PAYMENT_CTA,
  DASHBOARD_DEV_SKIP_PAYMENT_ERROR,
  DASHBOARD_DEV_SKIP_PAYMENT_LOADING,
} from "@/lib/admin/funnels/ui-copy";
import { OFFER_TYPES, type AgenceCheckoutOfferType } from "@/lib/commercial/constants";
import { DASHBOARD_EYEBROW, dashboardPageTitle } from "@/lib/dashboard/copy";
import {
  getDashboardDeveloperModeEnabledServerSnapshot,
  getDashboardDeveloperModeEnabledSnapshot,
  subscribeDashboardDeveloperModeEnabled,
} from "@/lib/dashboard/developer-mode";
import type { DashboardData, OnboardingIntentionLevel } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { OnboardingFormFields } from "./onboarding-form-fields";
import { StepScreenShare } from "./steps/step-screen-share";
import { StepDashboardPreview } from "./steps/step-dashboard-preview";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepHesitationSlides } from "./steps/step-hesitation-slides";
import { StepIntentionWindow } from "./steps/step-intention-window";
import { StepPricingCard } from "./steps/step-pricing-card";
import { StepEmbeddedCheckout } from "./steps/step-embedded-checkout";
const STEP_COUNT = 7;

function agenceOfferDisplayLabel(offer: AgenceCheckoutOfferType): string {
  if (offer === OFFER_TYPES.starter998_5) {
    return "Hercule Starter";
  }
  if (offer === OFFER_TYPES.growth1498_10) {
    return "Hercule Growth";
  }
  return "la formule";
}

// #region agent log helper
function logAgenceStep2Context(step: number, data: DashboardData) {
  if (step !== 2) return;
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "820c81",
    },
    body: JSON.stringify({
      sessionId: "820c81",
      runId: "pre-fix",
      hypothesisId: "B,D",
      location: "onboarding-preview-wizard.tsx:step2",
      message: "agence wizard step 2 render context",
      data: {
        step,
        dashboardMode: data.dashboardMode,
        component: "OnboardingFormFields",
        passesDataToFormStep: true,
        form: data.form,
        formKeys: Object.keys(data.form ?? {}),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

type OnboardingPreviewWizardProps = {
  data: DashboardData;
  onRefresh: () => void;
};

export function OnboardingPreviewWizard({
  data,
  onRefresh,
}: OnboardingPreviewWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedOfferType, setSelectedOfferType] = useState<AgenceCheckoutOfferType>(
    OFFER_TYPES.starter998_5,
  );
  const [tieDownAccepted, setTieDownAccepted] = useState(false);
  const [intentionLevel, setIntentionLevel] = useState<OnboardingIntentionLevel | null>(null);
  const [showHesitationSlides, setShowHesitationSlides] = useState(false);
  const [fastCheckout, setFastCheckout] = useState(false);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState<string | null>(null);
  const [checkoutPreloadError, setCheckoutPreloadError] = useState<string | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);
  const [skipError, setSkipError] = useState<string | null>(null);
  const checkoutPreloadStartedRef = useRef(false);
  const developerModeEnabled = useSyncExternalStore(
    subscribeDashboardDeveloperModeEnabled,
    getDashboardDeveloperModeEnabledSnapshot,
    getDashboardDeveloperModeEnabledServerSnapshot,
  );
  const progressValue = ((step + 1) / STEP_COUNT) * 100;

  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  const isCheckoutStep = step === 6;
  const isPricingStep = step === 5;
  const isIntentionStep = step === 4;
  const isFaqStep = step === 3;
  const canGoNext = !isFaqStep || tieDownAccepted;

  const preloadCheckout = useCallback(async () => {
    if (checkoutPreloadStartedRef.current) {
      return;
    }
    checkoutPreloadStartedRef.current = true;

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: data.slug,
          offerType: selectedOfferType,
          fast: fastCheckout,
        }),
      });
      const body = (await response.json()) as { clientSecret?: string; error?: string };

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
  }, [data.slug, selectedOfferType, fastCheckout]);

  useEffect(() => {
    checkoutPreloadStartedRef.current = false;
    setCheckoutClientSecret(null);
    setCheckoutPreloadError(null);
  }, [data.slug, selectedOfferType, fastCheckout]);

  useEffect(() => {
    if (step < 5) {
      return;
    }

    void preloadCheckout();
  }, [step, preloadCheckout]);

  useEffect(() => {
    if (isPricingStep && intentionLevel === "hesitate") {
      setShowHesitationSlides(true);
    }
  }, [intentionLevel, isPricingStep]);

  useEffect(() => {
    logAgenceStep2Context(step, data);
  }, [step, data]);

  function goNext() {
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }

  function handleIntentionSelect(level: OnboardingIntentionLevel) {
    setIntentionLevel(level);
    if (level === "strong") {
      setSelectedOfferType(OFFER_TYPES.starter998_5);
    }
    setStep(5);
  }

  function goPrev() {
    setStep((current) => Math.max(current - 1, 0));
  }

  async function simulatePayment() {
    setSkipLoading(true);
    setSkipError(null);

    try {
      const response = await fetch(
        `/api/dashboard/${encodeURIComponent(data.slug)}/dev-skip-payment`,
        { method: "POST" },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? DASHBOARD_DEV_SKIP_PAYMENT_ERROR);
      }
      onRefresh();
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : DASHBOARD_DEV_SKIP_PAYMENT_ERROR);
    } finally {
      setSkipLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "mx-auto px-6 pb-20",
        isCheckoutStep ? "max-w-5xl" : "max-w-3xl",
      )}
    >
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow={DASHBOARD_EYEBROW}
          title={dashboardPageTitle(data.slug)}
          subtitle={prospectLine}
        />
      </div>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            <span>Étape {step + 1} sur {STEP_COUNT}</span>
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
              {step === 1 && <StepDashboardPreview />}
              {step === 2 && (
                <OnboardingFormFields mode="preview" data={data} idPrefix="preview" />
              )}
              {step === 3 && (
                <StepFaqTieDown
                  audience="agence"
                  bleedContext={data.bleedContext}
                  tieDownAccepted={tieDownAccepted}
                  onTieDownChange={setTieDownAccepted}
                />
              )}
              {step === 4 && (
                <StepIntentionWindow audience="agence" onSelect={handleIntentionSelect} />
              )}
              {step === 5 && (
                <>
                  <StepPricingCard
                    selectedOffer={selectedOfferType}
                    onSelectOffer={setSelectedOfferType}
                    fastEnabled={fastCheckout}
                    onFastChange={setFastCheckout}
                    onProceed={goNext}
                  />
                  <StepHesitationSlides
                    open={showHesitationSlides}
                    audience="agence"
                    bleedContext={data.bleedContext}
                    selectedOfferLabel={agenceOfferDisplayLabel(selectedOfferType)}
                    onOpenChange={setShowHesitationSlides}
                    onActivateCheckout={goNext}
                  />
                </>
              )}
              {step === 6 && (
                <StepEmbeddedCheckout
                  slug={data.slug}
                  offerType={selectedOfferType}
                  fast={fastCheckout}
                  clientSecret={checkoutClientSecret}
                  preloadError={checkoutPreloadError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {(developerModeEnabled && isCheckoutStep) || !isCheckoutStep ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={step === 0 || skipLoading}
            >
              Précédent
            </Button>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              {developerModeEnabled && isCheckoutStep ? (
                <Button
                  type="button"
                  onClick={() => void simulatePayment()}
                  disabled={skipLoading}
                >
                  {skipLoading ? DASHBOARD_DEV_SKIP_PAYMENT_LOADING : DASHBOARD_DEV_SKIP_PAYMENT_CTA}
                </Button>
              ) : null}
              {!isIntentionStep && !isPricingStep && !isCheckoutStep && (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={step === STEP_COUNT - 1 || !canGoNext}
                >
                  Suivant
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {skipError ? (
          <p className="text-sm text-destructive">{skipError}</p>
        ) : null}
      </div>
    </div>
  );
}
