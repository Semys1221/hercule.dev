"use client";

import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

import { FunnelNav } from "./funnel-nav";

type ChecklistStepProps = {
  copy: Extract<StepCopy, { kind: "checklist" }>;
  onContinue: () => void;
};

export function ChecklistStep({ copy, onContinue }: ChecklistStepProps) {
  return (
    <div className="space-y-4 text-left">
      <h2 className="text-[22px] font-normal leading-snug tracking-tight text-foreground">
        {copy.title}
      </h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{copy.body}</p>
      <p className="text-[15px] font-medium text-foreground">
        Pensez simplement à avoir à portée de main :
      </p>
      <ul className="list-disc space-y-1 pl-5 text-[15px] text-muted-foreground">
        {copy.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{copy.closing}</p>
      <FunnelNav
        showBack={false}
        onContinue={onContinue}
        continueLabel="Terminer"
      />
    </div>
  );
}
