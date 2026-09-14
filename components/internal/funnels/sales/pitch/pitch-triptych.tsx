"use client";

import { memo } from "react";

import type { PitchWizardStepId } from "@/lib/admin/funnels/sales-pitch-wizard";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { PitchInterpolationContext } from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  PITCH_TRIPTYCH_BY_STEP,
  type PitchTriptychZone,
} from "@/lib/admin/funnels/sales-pitch-triptych-copy";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

import { GlowCard } from "./pitch-primitives";

type PitchTriptychProps = {
  stepId: PitchWizardStepId;
  audience: Audience;
  values: SalesQualificationValues;
  context?: PitchInterpolationContext;
  className?: string;
};

function resolveTriptychHeadline(
  template: string,
  audience: Audience,
  values: SalesQualificationValues,
  context?: PitchInterpolationContext,
): string {
  return formatPitchWizardInterpolation(template, values, audience, context);
}

export const PitchTriptych = memo(function PitchTriptych({
  stepId,
  audience,
  values,
  context,
  className,
}: PitchTriptychProps) {
  const content = PITCH_TRIPTYCH_BY_STEP[stepId];
  if (!content) {
    return null;
  }

  const zones: Array<{ zone: PitchTriptychZone; label: string; headline: string }> = [
    {
      zone: "do",
      label: content.do.label,
      headline: resolveTriptychHeadline(content.do.headline, audience, values, context),
    },
    {
      zone: "differ",
      label: content.differ.label,
      headline: resolveTriptychHeadline(content.differ.headline, audience, values, context),
    },
    {
      zone: "help",
      label: content.help.label,
      headline: resolveTriptychHeadline(content.help.headline, audience, values, context),
    },
  ];

  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {zones.map((entry) => (
        <GlowCard key={entry.zone} variant={entry.zone === "differ" ? "primary" : "default"}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {entry.label}
          </p>
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              entry.zone === "help" && "text-primary",
            )}
          >
            {entry.headline}
          </p>
        </GlowCard>
      ))}
    </div>
  );
});
