"use client";

import { CalendlyInline } from "@/components/booking/reservation/calendly-inline";
import { Button } from "@/components/ui/button";
import type { StepCopy } from "@/lib/booking/comptable-delivery-funnel/copy";

type CalendlyStepProps = {
  copy: Extract<StepCopy, { kind: "calendly" }>;
  calendlyUrl: string;
  onScheduled: () => void;
  onBack: () => void;
};

export function CalendlyStep({
  copy,
  calendlyUrl,
  onScheduled,
  onBack,
}: CalendlyStepProps) {
  return (
    <div className="space-y-4 text-left lg:col-span-2">
      <div className="mx-auto max-w-[640px] space-y-3 px-0 lg:px-4">
        <h2 className="text-[22px] font-normal leading-snug tracking-tight text-foreground">
          {copy.title}
        </h2>
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-[15px] leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <p className="text-[15px] font-medium text-foreground">{copy.cta}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <CalendlyInline
          url={calendlyUrl}
          onScheduled={onScheduled}
          tone="light"
          className="min-h-[620px]"
        />
      </div>
      <div className="mx-auto max-w-[640px]">
        <Button type="button" variant="link" className="h-auto p-0" onClick={onBack}>
          Retour aux questions
        </Button>
      </div>
    </div>
  );
}
