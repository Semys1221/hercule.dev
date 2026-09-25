"use client";

import { Textarea } from "@/components/ui/textarea";
import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

import { FunnelNav } from "./funnel-nav";

type FreeTextStepProps = {
  copy: Extract<StepCopy, { kind: "free_text" }>;
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function FreeTextStep({
  copy,
  value,
  onChange,
  onBack,
  onContinue,
}: FreeTextStepProps) {
  return (
    <div className="space-y-4 text-left">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {copy.title}
      </p>
      <h2 className="text-[22px] font-normal leading-snug tracking-tight text-foreground">
        {copy.question}
      </h2>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.placeholder}
        className="min-h-[120px] rounded-xl text-[15px]"
      />
      <FunnelNav
        onBack={onBack}
        onContinue={onContinue}
        continueDisabled={!value.trim()}
      />
    </div>
  );
}
