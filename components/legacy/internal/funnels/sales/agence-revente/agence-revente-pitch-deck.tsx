"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { PipelineDashboardMetrics } from "@/lib/legacy/calendly/pipeline-dashboard";

import { AgenceReventePitchCapacite } from "./agence-revente-pitch-capacite";
import { AgenceReventePitchProduit } from "./agence-revente-pitch-produit";
import { AgenceReventePitchShell } from "./agence-revente-pitch-shell";
import {
  getPitchSteps,
  getStepTitle,
  isSectionTransition,
  type PitchStep,
} from "./agence-revente-pitch-steps";
import type { AgenceReventeWizardValues } from "./agence-revente-wizard";

const CALENDLY_CUE_REVEAL_INDEX = 2;

type AgenceReventePitchDeckProps = {
  metrics: PipelineDashboardMetrics;
  qualification: AgenceReventeWizardValues;
  productName: string;
  productPriceEur: number;
  paymentLinkUrl: string;
};

export function AgenceReventePitchDeck({
  metrics,
  qualification,
  productName,
  productPriceEur,
  paymentLinkUrl,
}: AgenceReventePitchDeckProps) {
  const steps = useMemo(() => getPitchSteps(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [sectionTransition, setSectionTransition] = useState(false);
  const [calendlyAcknowledged, setCalendlyAcknowledged] = useState(false);
  const prevStepRef = useRef<PitchStep>(steps[0]);

  const safeStepIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
  const currentStep = steps[safeStepIndex];
  const progressValue = steps.length > 0 ? ((safeStepIndex + 1) / steps.length) * 100 : 0;
  const canGoPrev = safeStepIndex > 0;
  const isLastStep = safeStepIndex === steps.length - 1;

  const requiresCalendlyAck =
    currentStep.kind === "capacite_pitch" &&
    currentStep.revealIndex === CALENDLY_CUE_REVEAL_INDEX;

  const canGoNext =
    safeStepIndex < steps.length - 1 &&
    (!requiresCalendlyAck || calendlyAcknowledged);

  const canvasKey = useMemo(() => {
    if (currentStep.kind === "capacite_pitch") {
      return "capacite";
    }
    return "produit";
  }, [currentStep]);

  const latestBlockIndex = useMemo(() => {
    if (currentStep.kind === "produit_reveal") {
      return currentStep.revealIndex;
    }
    if (currentStep.kind === "capacite_pitch") {
      return currentStep.revealIndex;
    }
    return -1;
  }, [currentStep]);

  const transitionToStep = useCallback(
    (nextIndex: number) => {
      const nextStep = steps[nextIndex];
      const shouldTransition = isSectionTransition(prevStepRef.current, nextStep);
      setSectionTransition(shouldTransition);
      prevStepRef.current = nextStep;
      setStepIndex(nextIndex);

      if (
        nextStep.kind === "capacite_pitch" &&
        nextStep.revealIndex === CALENDLY_CUE_REVEAL_INDEX
      ) {
        setCalendlyAcknowledged(false);
      }
    },
    [steps],
  );

  const handlePrev = useCallback(() => {
    transitionToStep(Math.max(safeStepIndex - 1, 0));
  }, [safeStepIndex, transitionToStep]);

  const handleNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }
    transitionToStep(Math.min(safeStepIndex + 1, steps.length - 1));
  }, [canGoNext, safeStepIndex, steps.length, transitionToStep]);

  const handleCalendlyAcknowledge = useCallback(() => {
    setCalendlyAcknowledged(true);
  }, []);

  const canvas = useMemo(() => {
    if (currentStep.kind === "produit_reveal") {
      return (
        <AgenceReventePitchProduit
          metrics={metrics}
          companyName={qualification.company_name}
          revealIndex={currentStep.revealIndex}
          latestBlockIndex={latestBlockIndex}
        />
      );
    }

    if (currentStep.kind === "capacite_pitch") {
      return (
        <AgenceReventePitchCapacite
          metrics={metrics}
          qualification={qualification}
          productName={productName}
          productPriceEur={productPriceEur}
          paymentLinkUrl={paymentLinkUrl}
          revealIndex={currentStep.revealIndex}
          latestBlockIndex={latestBlockIndex}
          calendlyAcknowledged={calendlyAcknowledged}
          onCalendlyAcknowledge={handleCalendlyAcknowledge}
        />
      );
    }

    return null;
  }, [
    calendlyAcknowledged,
    paymentLinkUrl,
    currentStep,
    handleCalendlyAcknowledge,
    latestBlockIndex,
    metrics,
    productName,
    productPriceEur,
    qualification,
  ]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AgenceReventePitchShell
        progressValue={progressValue}
        title={getStepTitle(currentStep)}
        canvas={canvas}
        canvasKey={canvasKey}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        nextLabel={isLastStep ? "Fin" : undefined}
        sectionTransition={sectionTransition}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
