"use client";

import { ArrowRight, Cog, Handshake, Radar } from "lucide-react";
import { memo } from "react";

import { FlowNode } from "./pitch-primitives";
import { PITCH_PILLARS } from "../sales-pitch-wizard-slides";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const PILLAR_ICONS = [Radar, Cog, Handshake] as const;

export const PitchSlidePillars = memo(function PitchSlidePillars(_props: PitchSlideBaseProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-4">
        {PITCH_PILLARS.map((pillar, index) => {
          const Icon = PILLAR_ICONS[index] ?? Radar;
          return (
            <div key={pillar.name} className="flex items-center gap-2 sm:gap-4">
              <FlowNode icon={Icon} title={pillar.name} subtitle={pillar.tagline} />
              {index < PITCH_PILLARS.length - 1 ? (
                <ArrowRight className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
});
