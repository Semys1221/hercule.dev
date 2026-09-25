"use client";

import { Button } from "@/components/ui/button";
import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";
import { cn } from "@/lib/utils";

import { FunnelNav } from "./funnel-nav";

type ChoiceStepProps = {
  copy: Extract<StepCopy, { kind: "single_choice" }>;
  value: string | undefined;
  onChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function ChoiceStep({
  copy,
  value,
  onChange,
  onBack,
  onContinue,
}: ChoiceStepProps) {
  return (
    <div className="space-y-5 text-left">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.title}
        </p>
        <h2 className="mt-2 text-[22px] font-normal leading-snug tracking-tight text-foreground">
          {copy.question}
        </h2>
      </div>
      <div className="space-y-2">
        {copy.options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            className={cn(
              "h-auto min-h-[50px] w-full justify-start whitespace-normal rounded-xl px-4 py-3 text-left font-normal text-[15px]",
              value === option.value && "border-primary bg-primary/5",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <FunnelNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!value?.trim()}
      />
    </div>
  );
}
