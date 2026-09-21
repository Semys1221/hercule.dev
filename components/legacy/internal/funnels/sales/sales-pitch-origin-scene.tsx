"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { HerculeMark } from "@/components/hercule-mark";
import { TEAM_IMAGE_PRESET } from "@/lib/legacy/admin/funnels/team-image-preset";
import type { Audience } from "@/lib/legacy/admin/navigation";
import { cn } from "@/lib/utils";

import { CompanyOriginTimeline } from "./company-origin-timeline";

type SalesPitchOriginSceneProps = {
  audience: Audience;
  className?: string;
};

function LegacyStack2018Illustration() {
  const boxes = [
    { y: 52, depth: 0 },
    { y: 30, depth: 1 },
    { y: 8, depth: 2 },
  ] as const;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="0 0 120 88"
        className="h-[5.5rem] w-[7.5rem] text-muted-foreground"
        aria-hidden
      >
        {boxes.map((box) => {
          const opacity = 0.35 + box.depth * 0.12;

          return (
            <g key={box.y} transform={`translate(18, ${box.y})`}>
              <path
                d="M72 0 L84 -10 L84 18 L72 28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity={opacity * 0.85}
              />
              <path
                d="M0 0 L12 -10 L84 -10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity={opacity * 0.85}
              />
              <rect
                x="0"
                y="0"
                width="72"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                opacity={opacity}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          2018
        </p>
        <p className="text-xs text-foreground">Outil interne backend</p>
      </div>
    </div>
  );
}

function FoundationBookMockup({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-[7.75rem] w-[6.75rem]"
        style={{ perspective: "900px" }}
      >
        <div
          className={cn(
            "relative h-full w-full rounded-r-lg rounded-l-[3px] border border-border/70 bg-gradient-to-br from-card via-muted/40 to-muted shadow-[0_18px_40px_-22px_rgba(0,0,0,0.85)]",
            !reducedMotion && "motion-safe:animate-[origin-book-float_5s_ease-in-out_infinite]",
          )}
          style={{ transform: "rotateY(-14deg)", transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-y-0 left-0 w-2.5 rounded-l-[3px] bg-foreground/12"
            aria-hidden
          />
          <div
            className="absolute inset-y-2 right-0 w-1 rounded-r-sm bg-muted-foreground/25"
            aria-hidden
          />
          <div
            className="absolute inset-y-3 right-1 w-px bg-border/50"
            aria-hidden
          />
          <div className="absolute left-2.5 right-2 top-[58%] h-px bg-border/70" aria-hidden />
          <div className="flex h-full flex-col items-center justify-center gap-2.5 px-3 pl-5">
            <HerculeMark variant="dual" className="size-9 text-foreground" />
            <div className="space-y-0.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                Hercule
              </p>
              <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                Foundation
              </p>
            </div>
          </div>
        </div>
        <div
          className="absolute -bottom-2 left-3 right-1 h-3 rounded-full bg-foreground/10 blur-md"
          aria-hidden
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          2026
        </p>
        <p className="text-xs text-foreground">Hercule Foundation</p>
      </div>
    </div>
  );
}

function OriginEvolutionVisual({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="flex w-full max-w-lg items-center justify-center gap-5 sm:max-w-xl sm:gap-8">
      <LegacyStack2018Illustration />
      <ArrowRight
        className="size-5 shrink-0 text-muted-foreground/70"
        strokeWidth={1.5}
        aria-hidden
      />
      <FoundationBookMockup reducedMotion={reducedMotion} />
    </div>
  );
}

export function SalesPitchOriginScene({ audience, className }: SalesPitchOriginSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(media.matches);
    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);

    return () => media.removeEventListener("change", updateReducedMotion);
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          TEAM_IMAGE_PRESET.frameClass,
          "flex items-center justify-center bg-card/40 px-6 py-10 sm:px-10",
        )}
      >
        <OriginEvolutionVisual reducedMotion={reducedMotion} />
      </div>
      <CompanyOriginTimeline audience={audience} />
    </div>
  );
}
