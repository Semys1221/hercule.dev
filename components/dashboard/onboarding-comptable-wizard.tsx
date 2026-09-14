"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Progress } from "@/components/ui/progress";
import { DASHBOARD_DEV_SKIP_PAYMENT_ERROR } from "@/lib/admin/funnels/ui-copy";
import { OFFER_TYPES_COMPTABLE, type OfferTypeComptable } from "@/lib/commercial/constants";
import {
  RECOVERY_MAX_CYCLES,
  serviceFitsToBoolean,
  type RecoveryDiagnostic,
  type RecoveryPitchAngle,
} from "@/lib/dashboard/closing-recovery";
import {
  emptyDashboardClosingState,
  parseDashboardClosing,
} from "@/lib/dashboard/closing-state";
import {
  getDashboardDeveloperModeEnabledServerSnapshot,
  getDashboardDeveloperModeEnabledSnapshot,
  subscribeDashboardDeveloperModeEnabled,
} from "@/lib/dashboard/developer-mode";
import {
  isClosingFitWhyValid,
  type ClosingCommitLevel,
  type ClosingFitLevel,
} from "@/lib/dashboard/onboarding-faq";
import { requestCabinetCheckoutClientSecret } from "@/lib/payments/cabinet-checkout";
import type { DashboardClosingState, DashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { ComptableWizardControls } from "./onboarding-comptable-wizard-controls";
import { ComptableWizardStepView } from "./onboarding-comptable-wizard-step";

const STEP_COUNT = 6;

type CommitView = "initial" | "final";

type OnboardingComptableWizardProps = {
  data: DashboardData;
  onRefresh?: () => void;
};

function resolveCommitView(closing: DashboardClosingState): CommitView {
  if (closing.recoveryCycle >= RECOVERY_MAX_CYCLES && !closing.finalCommitAccepted) {
    return "final";
  }
  return "initial";
}

function resolveStripeRevealed(closing: DashboardClosingState): boolean {
  return closing.commit === "launch" || closing.finalCommitAccepted;
}

export function OnboardingComptableWizard({
  data,
  onRefresh,
}: OnboardingComptableWizardProps) {
  const initialClosing = parseDashboardClosing(data.closing);

  const [step, setStep] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<OfferTypeComptable>(
    OFFER_TYPES_COMPTABLE.monthly1499,
  );
  const [tieDownAccepted, setTieDownAccepted] = useState(false);
  const [closingFit, setClosingFit] = useState<ClosingFitLevel | null>(
    initialClosing.fit,
  );
  const [fitWhy, setFitWhy] = useState(initialClosing.fitWhy);
  const [closingState, setClosingState] = useState<DashboardClosingState>(initialClosing);
  const [commitLevel, setCommitLevel] = useState<ClosingCommitLevel | null>(
    initialClosing.commit,
  );
  const [commitView, setCommitView] = useState<CommitView>(resolveCommitView(initialClosing));
  const [stripeRevealed, setStripeRevealed] = useState(resolveStripeRevealed(initialClosing));
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryAngle, setRecoveryAngle] = useState<RecoveryPitchAngle>(1);
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
  const isPricingStep = step === 4;
  const isCheckoutStep = step === 5;
  const faqStepComplete =
    Boolean(closingFit) && isClosingFitWhyValid(fitWhy) && tieDownAccepted;
  const canGoNext = !isFaqStep || faqStepComplete;

  const persistDashboard = useCallback(
    async (payload: Record<string, unknown>) => {
      await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    [data.slug],
  );

  const persistClosing = useCallback(
    async (partial: Partial<DashboardClosingState>, tieDown?: boolean) => {
      let nextClosing = emptyDashboardClosingState();
      setClosingState((current) => {
        nextClosing = { ...current, ...partial };
        return nextClosing;
      });
      await persistDashboard({
        ...(tieDown ? { tieDownAccepted: true } : {}),
        closing: nextClosing,
      });
    },
    [persistDashboard],
  );

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
    if (isFaqStep && faqStepComplete && closingFit) {
      void persistClosing(
        {
          fit: closingFit,
          fitWhy: fitWhy.trim(),
        },
        true,
      );
    }
    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }, [closingFit, faqStepComplete, fitWhy, isFaqStep, persistClosing]);

  const goPrev = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleCommitSelect = useCallback(
    (level: ClosingCommitLevel) => {
      setCommitLevel(level);
      void persistClosing({ commit: level });

      if (level === "launch") {
        setStripeRevealed(true);
        return;
      }

      if (closingState.recoveryCycle >= RECOVERY_MAX_CYCLES) {
        setCommitView("final");
        return;
      }

      setRecoveryAngle((closingState.recoveryCycle + 1) as RecoveryPitchAngle);
      setShowRecovery(true);
    },
    [closingState.recoveryCycle, persistClosing],
  );

  const handleRecoveryComplete = useCallback(
    (diagnostic: RecoveryDiagnostic) => {
      const nextCycle = closingState.recoveryCycle + 1;
      setShowRecovery(false);
      setCommitLevel(null);

      void persistClosing({
        serviceFits: serviceFitsToBoolean(diagnostic.serviceFits),
        serviceWhy: diagnostic.serviceWhy.trim(),
        friction: diagnostic.friction.trim(),
        recoveryCycle: nextCycle,
      });

      if (nextCycle >= RECOVERY_MAX_CYCLES) {
        setCommitView("final");
        return;
      }

      setCommitView("initial");
    },
    [closingState.recoveryCycle, persistClosing],
  );

  const handleFinalCommit = useCallback(() => {
    setStripeRevealed(true);
    void persistClosing({
      finalCommitAccepted: true,
      recoveryCompleted: true,
    });
  }, [persistClosing]);

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

        <div className="mt-8 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
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
            closingFit={closingFit}
            fitWhy={fitWhy}
            commitLevel={commitLevel}
            commitView={commitView}
            stripeRevealed={stripeRevealed}
            recoveryAngle={recoveryAngle}
            checkoutClientSecret={checkoutClientSecret}
            checkoutPreloadError={checkoutPreloadError}
            showRecovery={showRecovery}
            onTieDownChange={setTieDownAccepted}
            onClosingFitChange={setClosingFit}
            onFitWhyChange={setFitWhy}
            onSelectOffer={setSelectedOffer}
            onProceedFromPricing={goNext}
            onCommitSelect={handleCommitSelect}
            onRecoveryComplete={handleRecoveryComplete}
            onFinalCommit={handleFinalCommit}
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
