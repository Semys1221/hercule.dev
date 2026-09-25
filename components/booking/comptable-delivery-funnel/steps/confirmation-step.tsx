"use client";

import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

import { FunnelNav } from "./funnel-nav";

type ConfirmationStepProps = {
  copy: Extract<StepCopy, { kind: "confirmation" }>;
  onContinue: () => void;
};

export function ConfirmationStep({ copy, onContinue }: ConfirmationStepProps) {
  return (
    <div className="space-y-4 text-left">
      <h2 className="text-[28px] font-normal leading-tight tracking-tight text-foreground">
        {copy.title}
      </h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>
      <FunnelNav showBack={false} onContinue={onContinue} continueLabel="Préparer mon rendez-vous" />
    </div>
  );
}
