"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { OfferTypeComptable } from "@/lib/commercial/constants";
import type { RecoveryDiagnostic, RecoveryPitchAngle } from "@/lib/dashboard/closing-recovery";
import type { ClosingCommitLevel, ClosingFitLevel } from "@/lib/dashboard/onboarding-faq";
import type { DashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { ComptableOnboardingFormFields } from "./comptable-onboarding-form-fields";
import { StepClosingRecovery } from "./steps/step-closing-recovery";
import { StepDashboardPreviewComptable } from "./steps/step-dashboard-preview-comptable";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepFinalCommit } from "./steps/step-final-commit";
import { StepPaymentCommit } from "./steps/step-payment-commit";
import { StepPricingCardComptable } from "./steps/step-pricing-card-comptable";
import { StepScreenShare } from "./steps/step-screen-share";

type CommitView = "initial" | "final";

type ComptableWizardStepViewProps = {
  step: number;
  data: DashboardData;
  selectedOffer: OfferTypeComptable;
  tieDownAccepted: boolean;
  closingFit: ClosingFitLevel | null;
  fitWhy: string;
  commitLevel: ClosingCommitLevel | null;
  commitView: CommitView;
  stripeRevealed: boolean;
  recoveryAngle: RecoveryPitchAngle;
  checkoutClientSecret: string | null;
  checkoutPreloadError: string | null;
  showRecovery: boolean;
  onTieDownChange: (accepted: boolean) => void;
  onClosingFitChange: (fit: ClosingFitLevel) => void;
  onFitWhyChange: (why: string) => void;
  onSelectOffer: (offer: OfferTypeComptable) => void;
  onProceedFromPricing: () => void;
  onCommitSelect: (level: ClosingCommitLevel) => void;
  onRecoveryComplete: (diagnostic: RecoveryDiagnostic) => void;
  onFinalCommit: () => void;
};

export function ComptableWizardStepView({
  step,
  data,
  selectedOffer,
  tieDownAccepted,
  closingFit,
  fitWhy,
  commitLevel,
  commitView,
  stripeRevealed,
  recoveryAngle,
  checkoutClientSecret,
  checkoutPreloadError,
  showRecovery,
  onTieDownChange,
  onClosingFitChange,
  onFitWhyChange,
  onSelectOffer,
  onProceedFromPricing,
  onCommitSelect,
  onRecoveryComplete,
  onFinalCommit,
}: ComptableWizardStepViewProps) {
  const isCheckoutStep = step === 5;
  const audience = data.audience === "cif" ? "cif" : "comptable";

  return (
    <>
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
            {step === 0 ? <StepScreenShare /> : null}
            {step === 1 ? <StepDashboardPreviewComptable /> : null}
            {step === 2 ? (
              <ComptableOnboardingFormFields
                mode="preview"
                data={data}
                idPrefix="preview-comptable"
              />
            ) : null}
            {step === 3 ? (
              <StepFaqTieDown
                audience={audience}
                bleedContext={data.bleedContext}
                tieDownId="tie-down-comptable"
                tieDownAccepted={tieDownAccepted}
                onTieDownChange={onTieDownChange}
                closingFit={closingFit}
                onClosingFitChange={onClosingFitChange}
                fitWhy={fitWhy}
                onFitWhyChange={onFitWhyChange}
              />
            ) : null}
            {step === 4 ? (
              <StepPricingCardComptable
                selectedOffer={selectedOffer}
                onSelectOffer={onSelectOffer}
                onProceed={onProceedFromPricing}
              />
            ) : null}
            {step === 5 ? (
              <div className="flex flex-col gap-6">
                {!stripeRevealed && commitView === "initial" ? (
                  <StepPaymentCommit value={commitLevel} onChange={onCommitSelect} />
                ) : null}
                {!stripeRevealed && commitView === "final" ? (
                  <StepFinalCommit
                    bleedContext={data.bleedContext}
                    onConfirm={onFinalCommit}
                  />
                ) : null}
                {stripeRevealed ? (
                  <StepEmbeddedCheckoutComptable
                    slug={data.slug}
                    audience={audience}
                    selectedOffer={selectedOffer}
                    startImmediately
                    clientSecret={checkoutClientSecret}
                    preloadError={checkoutPreloadError}
                  />
                ) : null}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <StepClosingRecovery
        open={showRecovery}
        angle={recoveryAngle}
        bleedContext={data.bleedContext}
        onComplete={onRecoveryComplete}
      />
    </>
  );
}
