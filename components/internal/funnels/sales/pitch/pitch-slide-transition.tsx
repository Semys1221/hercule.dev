"use client";

import { ArrowRight, Target } from "lucide-react";
import { memo } from "react";

import { Progress } from "@/components/ui/progress";
import { buildBleedTrack, interpolateBleed } from "@/lib/admin/funnels/sales-bleed-track";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { getPitchMirrorTemplate } from "../sales-pitch-wizard-slides";

import { GlowCard } from "./pitch-primitives";
import { PitchSurfacePanel } from "./pitch-surface-panel";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideTransition = memo(function PitchSlideTransition({
  slide,
  audience,
  values,
  context,
  immersive,
}: PitchSlideBaseProps) {
  const bleed = buildBleedTrack(values, audience);
  const mirror = interpolateBleed(getPitchMirrorTemplate(audience), bleed);
  const goalLabel = formatPitchWizardInterpolation("{goal6m}", values, audience, context);

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Objectifs</p>
          <Progress value={100} className="h-1.5" />
        </div>
        <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Foundation</p>
          <Progress value={8} className="h-1.5" />
        </div>
        <Target className="size-5 shrink-0 text-primary" aria-hidden />
      </div>

      <PitchSurfacePanel
        immersive={immersive}
        className="border-primary/30 bg-primary/5 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.18)]"
        contentClassName="flex flex-col gap-3"
      >
        <GlowCard variant="primary" className="border-0 bg-transparent p-0 shadow-none">
          <p className="text-lg font-medium leading-snug text-foreground">{mirror}</p>
        </GlowCard>
        <p className="text-center text-2xl font-semibold tracking-tight text-primary">{goalLabel}</p>
      </PitchSurfacePanel>
    </div>
  );
});
