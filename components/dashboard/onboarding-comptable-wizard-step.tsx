"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { OfferTypeComptable } from "@/lib/commercial/constants";
import { comptableOfferLabel } from "@/lib/commercial/comptable-pricing";
import type { DashboardData, OnboardingIntentionLevel } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

import { ComptableOnboardingFormFields } from "./comptable-onboarding-form-fields";
import { StepDashboardPreviewComptable } from "./steps/step-dashboard-preview-comptable";
import { StepEmbeddedCheckoutComptable } from "./steps/step-embedded-checkout-comptable";
import { StepFaqTieDown } from "./steps/step-faq-tie-down";
import { StepHesitationSlides } from "./steps/step-hesitation-slides";
import { StepIntentionWindow } from "./steps/step-intention-window";
import { StepPricingCardComptable } from "./steps/step-pricing-card-comptable";
import { StepScreenShare } from "./steps/step-screen-share";

type ComptableWizardStepViewProps = {
  step: number;
  data: DashboardData;
  selectedOffer: OfferTypeComptable;
  tieDownAccepted: boolean;
  checkoutClientSecret: string | null;
  checkoutPreloadError: string | null;
  showHesitationSlides: boolean;
  onTieDownChange: (accepted: boolean) => void;
  onSelectOffer: (offer: OfferTypeComptable) => void;
  onIntentionSelect: (level: OnboardingIntentionLevel) => void;
  onProceedFromPricing: () => void;
  onHesitationOpenChange: (open: boolean) => void;
};

export function ComptableWizardStepView({
  step,
  data,
  selectedOffer,
  tieDownAccepted,
  checkoutClientSecret,
  checkoutPreloadError,
  showHesitationSlides,
  onTieDownChange,
  onSelectOffer,
  onIntentionSelect,
  onProceedFromPricing,
  onHesitationOpenChange,
}: ComptableWizardStepViewProps) {
  const isCheckoutStep = step === 6;
  const audience = data.audience === "cif" ? "cif" : "comptable";

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
              audience={audience}
              bleedContext={data.bleedContext}
              tieDownId="tie-down-comptable"
              tieDownAccepted={tieDownAccepted}
              onTieDownChange={onTieDownChange}
            />
          ) : null}
          {step === 4 ? (
            <StepIntentionWindow audience={audience} onSelect={onIntentionSelect} />
          ) : null}
          {step === 5 ? (
            <>
              <StepPricingCardComptable
                selectedOffer={selectedOffer}
                onSelectOffer={onSelectOffer}
                onProceed={onProceedFromPricing}
              />
              <StepHesitationSlides
                open={showHesitationSlides}
                audience={audience}
                bleedContext={data.bleedContext}
                selectedOfferLabel={comptableOfferLabel(selectedOffer)}
                onOpenChange={onHesitationOpenChange}
                onActivateCheckout={onProceedFromPricing}
              />
            </>
          ) : null}
          {step === 6 ? (
            <StepEmbeddedCheckoutComptable
              slug={data.slug}
              audience={audience}
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
