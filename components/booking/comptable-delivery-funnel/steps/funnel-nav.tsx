"use client";

import { Button } from "@/components/ui/button";

type FunnelNavProps = {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
};

export function FunnelNav({
  onBack,
  onContinue,
  continueLabel = "Continuer",
  continueDisabled = false,
  showBack = true,
}: FunnelNavProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="outline"
          className="h-[50px] flex-1 rounded-xl font-normal"
          onClick={onBack}
        >
          Retour
        </Button>
      ) : null}
      <Button
        type="button"
        className="h-[50px] flex-1 rounded-xl font-normal"
        disabled={continueDisabled}
        onClick={onContinue}
      >
        {continueLabel}
      </Button>
    </div>
  );
}
