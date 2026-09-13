"use client";

import { Button } from "@/components/ui/button";
import {
  DASHBOARD_DEV_SKIP_PAYMENT_CTA,
  DASHBOARD_DEV_SKIP_PAYMENT_LOADING,
} from "@/lib/admin/funnels/ui-copy";

type ComptableWizardControlsProps = {
  step: number;
  canGoNext: boolean;
  developerModeEnabled: boolean;
  skipLoading: boolean;
  skipError: string | null;
  onPrev: () => void;
  onNext: () => void;
  onSimulatePayment: () => void;
};

export function ComptableWizardControls({
  step,
  canGoNext,
  developerModeEnabled,
  skipLoading,
  skipError,
  onPrev,
  onNext,
  onSimulatePayment,
}: ComptableWizardControlsProps) {
  const isIntentionStep = step === 4;
  const isPricingStep = step === 5;
  const isCheckoutStep = step === 6;
  const showNavigation = (developerModeEnabled && isCheckoutStep) || !isCheckoutStep;

  if (!showNavigation) {
    return skipError ? <p className="text-sm text-destructive">{skipError}</p> : null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          disabled={step === 0 || skipLoading}
        >
          Précédent
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {developerModeEnabled && isCheckoutStep ? (
            <Button type="button" onClick={onSimulatePayment} disabled={skipLoading}>
              {skipLoading ? DASHBOARD_DEV_SKIP_PAYMENT_LOADING : DASHBOARD_DEV_SKIP_PAYMENT_CTA}
            </Button>
          ) : null}
          {!isIntentionStep && !isPricingStep && !isCheckoutStep ? (
            <Button type="button" onClick={onNext} disabled={!canGoNext}>
              Suivant
            </Button>
          ) : null}
        </div>
      </div>
      {skipError ? <p className="text-sm text-destructive">{skipError}</p> : null}
    </>
  );
}
