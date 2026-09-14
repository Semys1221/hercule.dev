"use client";

import { ArrowRight, Cog, Handshake, Radar } from "lucide-react";
import { memo } from "react";

import { GlowCard } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import { PITCH_PILLARS } from "../sales-pitch-wizard-slides";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PILLAR_ICONS = [Radar, Cog, Handshake] as const;
const ORIGIN_YEARS = ["2018", "2025", "2026"] as const;

export const PitchSlidePillars = memo(function PitchSlidePillars({
  slide,
  audience,
  values,
  context,
}: PitchSlideBaseProps) {
  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <div className="flex w-full flex-wrap items-stretch justify-center gap-2 sm:gap-3">
        {PITCH_PILLARS.map((pillar, index) => {
          const Icon = PILLAR_ICONS[index] ?? Radar;
          return (
            <div key={pillar.name} className="flex items-center gap-2 sm:gap-3">
              <GlowCard variant="primary" className="min-w-[7.5rem] items-center text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="size-5" aria-hidden />
                </div>
                <p className="text-sm font-medium">{pillar.name.replace("Hercule ", "")}</p>
                <p className="text-[10px] leading-snug text-muted-foreground">{pillar.tagline}</p>
              </GlowCard>
              {index < PITCH_PILLARS.length - 1 ? (
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        {ORIGIN_YEARS.map((year, index) => (
          <div key={year} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center gap-1">
              {index > 0 ? <span className="h-px flex-1 bg-border" aria-hidden /> : null}
              <span className="size-2 rounded-full bg-primary" aria-hidden />
              {index < ORIGIN_YEARS.length - 1 ? (
                <span className="h-px flex-1 bg-border" aria-hidden />
              ) : null}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{year}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
