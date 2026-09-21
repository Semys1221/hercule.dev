"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PaymentStep } from "@/components/legacy/proposition/steps/payment-step";
import { ProposalBlockStep } from "@/components/legacy/proposition/steps/proposal-block-step";
import { ProposalPricingStep } from "@/components/legacy/proposition/steps/proposal-pricing-step";
import { ProposalRoiStep } from "@/components/legacy/proposition/steps/proposal-roi-step";
import { RecapStep } from "@/components/legacy/proposition/steps/recap-step";
import {
  getPricingOptions,
  resolveStripePaymentLinkUrl,
} from "@/lib/legacy/propositions/resolve-payment";
import type { PropositionConfig } from "@/lib/legacy/propositions/schema";
import {
  buildPropositionSteps,
  getStepPhaseLabel,
  stepRequiresValidation,
  type PropositionStep,
} from "@/lib/legacy/propositions/steps";

type PropositionWizardProps = {
  config: PropositionConfig;
};

function getValidationKey(step: PropositionStep): string {
  return step.id;
}

export function PropositionWizard({ config }: PropositionWizardProps) {
  const steps = useMemo(() => buildPropositionSteps(config), [config]);
  const pricingOptions = useMemo(() => getPricingOptions(config), [config]);
  const defaultPricingOptionId = useMemo(() => {
    if (!pricingOptions) {
      return null;
    }
    const recommended = pricingOptions.find((option) => option.recommended);
    return recommended?.id ?? pricingOptions[0]?.id ?? null;
  }, [pricingOptions]);

  const [stepIndex, setStepIndex] = useState(0);
  const [validatedSteps, setValidatedSteps] = useState<Record<string, boolean>>({});
  const [selectedPricingOptionId, setSelectedPricingOptionId] = useState<string | null>(
    defaultPricingOptionId,
  );
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setStepIndex(0);
    setValidatedSteps({});
    setSelectedPricingOptionId(defaultPricingOptionId);
  }, [config.slug, defaultPricingOptionId]);

  const safeStepIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const currentStep = steps[safeStepIndex];
  const progressValue = steps.length > 0 ? ((safeStepIndex + 1) / steps.length) * 100 : 0;

  const stripePaymentLinkUrl = useMemo(
    () => resolveStripePaymentLinkUrl(config, selectedPricingOptionId),
    [config, selectedPricingOptionId],
  );

  const isPricingStepComplete =
    validatedSteps["proposal-pricing"] === true &&
    (pricingOptions ? selectedPricingOptionId !== null : true);

  const isCurrentStepValidated = currentStep
    ? currentStep.kind === "pricing"
      ? isPricingStepComplete
      : !stepRequiresValidation(currentStep) ||
        validatedSteps[getValidationKey(currentStep)] === true
    : false;

  const allProposalStepsValidated = useMemo(() => {
    return steps
      .filter((step) => stepRequiresValidation(step))
      .every((step) => {
        if (step.kind === "pricing") {
          return isPricingStepComplete;
        }
        return validatedSteps[getValidationKey(step)] === true;
      });
  }, [steps, validatedSteps, isPricingStepComplete]);

  const setStepValidated = useCallback((stepId: string, accepted: boolean) => {
    setValidatedSteps((current) => ({
      ...current,
      [stepId]: accepted,
    }));
  }, []);

  const handlePrev = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    if (!isCurrentStepValidated) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [isCurrentStepValidated, steps.length]);

  if (!currentStep) {
    return null;
  }

  const phaseLabel = getStepPhaseLabel(currentStep);
  const isPaymentStep = currentStep.kind === "payment";
  const canGoPrev = safeStepIndex > 0;
  const canGoNext = !isPaymentStep && isCurrentStepValidated;

  const motionProps = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: 0.25 },
      };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
          <span>{phaseLabel}</span>
          <span>
            Étape {safeStepIndex + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progressValue} className="h-1.5 bg-zinc-800" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentStep.id} {...motionProps}>
          {currentStep.kind === "recap" ? (
            <RecapStep
              slide={currentStep.slide}
              accepted={validatedSteps[currentStep.id] === true}
              onAcceptedChange={(accepted) => setStepValidated(currentStep.id, accepted)}
            />
          ) : null}

          {currentStep.kind === "proposal-block" ? (
            <ProposalBlockStep
              block={currentStep.block}
              accepted={validatedSteps[currentStep.id] === true}
              onAcceptedChange={(accepted) => setStepValidated(currentStep.id, accepted)}
            />
          ) : null}

          {currentStep.kind === "roi" ? (
            <ProposalRoiStep
              roi={currentStep.roi}
              accepted={validatedSteps[currentStep.id] === true}
              onAcceptedChange={(accepted) => setStepValidated(currentStep.id, accepted)}
            />
          ) : null}

          {currentStep.kind === "pricing" ? (
            <ProposalPricingStep
              pricing={currentStep.pricing}
              accepted={validatedSteps[currentStep.id] === true}
              onAcceptedChange={(accepted) => setStepValidated(currentStep.id, accepted)}
              selectedOptionId={selectedPricingOptionId}
              onOptionSelect={setSelectedPricingOptionId}
              paymentLinkUrl={stripePaymentLinkUrl}
            />
          ) : null}

          {currentStep.kind === "payment" ? (
            <PaymentStep
              stripePaymentLinkUrl={stripePaymentLinkUrl}
              allValidated={allProposalStepsValidated}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {!isPaymentStep ? (
        <div className="mt-10 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
            disabled={!canGoPrev}
            onClick={handlePrev}
          >
            Précédent
          </Button>
          <Button type="button" disabled={!canGoNext} onClick={handleNext}>
            Suivant
          </Button>
        </div>
      ) : null}
    </div>
  );
}
