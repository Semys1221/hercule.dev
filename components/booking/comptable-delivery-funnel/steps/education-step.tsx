"use client";

import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

import { FunnelNav } from "./funnel-nav";

type EducationStepProps = {
  copy: Extract<StepCopy, { kind: "education" }>;
  onBack: () => void;
  onContinue: () => void;
  showBack?: boolean;
};

export function EducationStep({
  copy,
  onBack,
  onContinue,
  showBack = true,
}: EducationStepProps) {
  return (
    <div className="space-y-4 text-left">
      <h2 className="text-[22px] font-normal leading-snug tracking-tight text-foreground">
        {copy.title}
      </h2>
      <p className="text-[15px] font-medium leading-relaxed text-foreground">{copy.lead}</p>
      {copy.paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-[15px] leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
      <ul className="space-y-4">
        {copy.blocks.map((block) => (
          <li key={block.title}>
            <p className="text-[15px] font-medium text-foreground">{block.title}</p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{block.body}</p>
          </li>
        ))}
      </ul>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{copy.closing}</p>
      <FunnelNav showBack={showBack} onBack={onBack} onContinue={onContinue} />
    </div>
  );
}
