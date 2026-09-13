"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { OfferTypeComptable } from "@/lib/commercial/constants";
import type { DashboardData } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { ComptableOnboardingFormFields } from "./comptable-onboarding-form-fields";
import { StepDashboardPreviewComptable } from "./steps/step-dashboard-preview-comptable";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepPricingCardComptable } from "./steps/step-pricing-card-comptable";
import { StepScreenShare } from "./steps/step-screen-share";

type ComptableWizardStepViewProps = {
  step: number;
  data: DashboardData;
  selectedOffer: OfferTypeComptable;
  tieDownAccepted: boolean;
  checkoutClientSecret: string | null;
  checkoutPreloadError: string | null;
  onTieDownChange: (accepted: boolean) => void;
  onSelectOffer: (offer: OfferTypeComptable) => void;
  onProceedFromPricing: () => void;
};

export function ComptableWizardStepView({
  step,
  data,
  selectedOffer,
  tieDownAccepted,
  checkoutClientSecret,
  checkoutPreloadError,
  onTieDownChange,
  onSelectOffer,
  onProceedFromPricing,
}: ComptableWizardStepViewProps) {
  const isCheckoutStep = step === 5;

  return (
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
              audience="comptable"
              tieDownId="tie-down-comptable"
              tieDownAccepted={tieDownAccepted}
              onTieDownChange={onTieDownChange}
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
            <StepEmbeddedCheckoutComptable
              slug={data.slug}
              audience={data.audience === "cif" ? "cif" : "comptable"}
              selectedOffer={selectedOffer}
              startImmediately
              clientSecret={checkoutClientSecret}
              preloadError={checkoutPreloadError}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
