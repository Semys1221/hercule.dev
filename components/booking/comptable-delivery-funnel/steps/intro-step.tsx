"use client";

import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

import { FunnelNav } from "./funnel-nav";

type IntroStepProps = {
  copy: Extract<StepCopy, { kind: "intro" }>;
  onContinue: () => void;
};

export function IntroStep({ copy, onContinue }: IntroStepProps) {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-[28px] font-normal leading-tight tracking-tight text-foreground">
        {copy.title}
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>
      <FunnelNav showBack={false} onContinue={onContinue} />
    </div>
  );
}
