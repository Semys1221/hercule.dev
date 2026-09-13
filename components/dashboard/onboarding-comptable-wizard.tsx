"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Progress } from "@/components/ui/progress";
import { DASHBOARD_DEV_SKIP_PAYMENT_ERROR } from "@/lib/admin/funnels/ui-copy";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";
import { requestCabinetCheckoutClientSecret } from "@/lib/payments/cabinet-checkout";
import {
  getDashboardDeveloperModeEnabledServerSnapshot,
  getDashboardDeveloperModeEnabledSnapshot,
  subscribeDashboardDeveloperModeEnabled,
} from "@/lib/dashboard/developer-mode";
import type { DashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { ComptableWizardControls } from "./onboarding-comptable-wizard-controls";
import { ComptableWizardStepView } from "./onboarding-comptable-wizard-step";

const STEP_COUNT = 6;

type OnboardingComptableWizardProps = {
  data: DashboardData;
  onRefresh?: () => void;
};

export function OnboardingComptableWizard({
  data,
  onRefresh,
}: OnboardingComptableWizardProps) {
  const [step, setStep] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable>(
    OFFER_TYPES_COMPTABLE.monthly1499,
  );
  const [tieDownAccepted, setTieDownAccepted] = useState(false);
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

  const isFaqStep = step === 3;
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
      const checkoutAudience = data.audience === "cif" ? "cif" : "comptable";
      const clientSecret = await requestCabinetCheckoutClientSecret(
        checkoutAudience,
        data.slug,
        selectedOffer,
      );
      setCheckoutClientSecret(clientSecret);
      setCheckoutPreloadError(null);
    } catch (checkoutError) {
      checkoutPreloadStartedRef.current = false;
      setCheckoutPreloadError(
        checkoutError instanceof Error ? checkoutError.message : "Paiement indisponible",
      );
      setCheckoutClientSecret(null);
    }
  }, [data.audience, data.slug, selectedOffer]);

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

  const goNext = useCallback(() => {
    if (isFaqStep && tieDownAccepted) {
      void persistTieDown();
    }
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }, [isFaqStep, persistTieDown, tieDownAccepted]);

  const goPrev = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const simulatePayment = useCallback(async () => {
    setSkipLoading(true);
    setSkipError(null);

    try {
      const response = await fetch(
        `/api/dashboard/${encodeURIComponent(data.slug)}/dev-skip-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offerType: selectedOffer }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? DASHBOARD_DEV_SKIP_PAYMENT_ERROR);
      }
      onRefresh?.();
    } catch (err) {
      setSkipError(err instanceof Error ? err.message : DASHBOARD_DEV_SKIP_PAYMENT_ERROR);
    } finally {
      setSkipLoading(false);
    }
  }, [data.slug, onRefresh, selectedOffer]);

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

          <ComptableWizardStepView
            step={step}
            data={data}
            selectedOffer={selectedOffer}
            tieDownAccepted={tieDownAccepted}
            checkoutClientSecret={checkoutClientSecret}
            checkoutPreloadError={checkoutPreloadError}
            onTieDownChange={setTieDownAccepted}
            onSelectOffer={setSelectedOffer}
            onProceedFromPricing={goNext}
          />

          <ComptableWizardControls
            step={step}
            canGoNext={canGoNext}
            developerModeEnabled={developerModeEnabled}
            skipLoading={skipLoading}
            skipError={skipError}
            onPrev={goPrev}
            onNext={goNext}
            onSimulatePayment={() => void simulatePayment()}
          />
        </div>
      </main>
    </div>
  );
}
