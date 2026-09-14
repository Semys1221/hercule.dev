"use client";

import {
  ChronologieSection,
  type ChronologieStep,
} from "@/components/dashboard/chronologie-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  FoundationDeploymentPhase,
  FoundationFoundationBlock,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import type { TimelineStep } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SalesPitchTimelineStep = {
  id: string;
  label: string;
  meta?: string;
  title?: string;
  items?: string[];
  status: TimelineStep["status"];
};

type SalesPitchHorizontalTimelineProps = {
  steps: SalesPitchTimelineStep[];
  description?: string;
  footnote?: string;
  activeStatusLabel?: string;
  className?: string;
  immersive?: boolean;
};

function toChronologieSteps(steps: SalesPitchTimelineStep[]): ChronologieStep[] {
  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    meta: step.meta,
    status: step.status,
  }));
}

export function SalesPitchHorizontalTimeline({
  steps,
  description,
  footnote,
  activeStatusLabel = "Étape en cours",
  className,
  immersive = false,
}: SalesPitchHorizontalTimelineProps) {
  if (steps.length === 0) {
    return null;
  }

  const hasDetails = steps.some((step) => step.title || (step.items?.length ?? 0) > 0);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}

      <ChronologieSection
        layout="horizontal"
        animated={false}
        showHeader={false}
        steps={toChronologieSteps(steps)}
        activeStatusLabel={activeStatusLabel}
      />

      {hasDetails ? (
        <div
          className={cn(
            "grid gap-3",
            steps.length >= 4
              ? "sm:grid-cols-2 xl:grid-cols-4"
              : steps.length > 2
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "md:grid-cols-2",
          )}
        >
          {steps.map((step) =>
            immersive ? (
              <div
                key={step.id}
                className="flex flex-col gap-2 rounded-lg border border-border/40 p-4"
              >
                <TimelineDetailContent step={step} />
              </div>
            ) : (
              <Card key={step.id} className={cn(RESERVATION_SURFACE, "shadow-none")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{step.title ?? step.label}</CardTitle>
                  {step.meta && step.title && step.items?.length ? (
                    <p className="text-xs text-muted-foreground">{step.meta}</p>
                  ) : null}
                </CardHeader>
                {step.items?.length ? (
                  <CardContent className="pt-0">
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {step.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                ) : step.meta ? (
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.meta}</p>
                  </CardContent>
                ) : null}
              </Card>
            ),
          )}
        </div>
      ) : null}

      {footnote ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{footnote}</p>
      ) : null}
    </div>
  );
}

function TimelineDetailContent({ step }: { step: SalesPitchTimelineStep }) {
  return (
    <>
      <p className="text-sm font-medium text-foreground">{step.title ?? step.label}</p>
      {step.meta ? <p className="text-xs text-muted-foreground">{step.meta}</p> : null}
      {step.items?.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {step.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function buildFoundationBlocksTimelineSteps(
  blocks: FoundationFoundationBlock[],
): SalesPitchTimelineStep[] {
  return blocks.map((block, index) => ({
    id: block.id,
    label: block.month,
    meta: block.title,
    title: block.title,
    items: block.items,
    status: index === 0 ? "active" : "pending",
  }));
}

export function buildActivationDeploymentTimelineSteps(
  phases: FoundationDeploymentPhase[],
  weeklyHighlights: readonly string[],
  clocks: readonly { id: string; label: string; duration: string; message: string }[],
): SalesPitchTimelineStep[] {
  const deployClock = clocks.find((clock) => clock.id === "deploy");
  const guaranteeClock = clocks.find((clock) => clock.id === "guarantee");

  const phaseSteps = phases.map((phase, index) => {
    const weeklyHighlight =
      index === 0
        ? weeklyHighlights[0]
        : index === 1
          ? weeklyHighlights[2]
          : index === 2
            ? weeklyHighlights[5]
            : undefined;

    const items = [...phase.artifacts];
    if (weeklyHighlight) {
      items.push(weeklyHighlight);
    }
    if (index === phases.length - 1 && deployClock) {
      items.push(deployClock.message);
    }

    return {
      id: phase.id,
      label: phase.window,
      meta: phase.title,
      title: phase.title,
      items,
      status: (index === phases.length - 1 ? "active" : "pending") as TimelineStep["status"],
    };
  });

  if (!guaranteeClock) {
    return phaseSteps;
  }

  return [
    ...phaseSteps,
    {
      id: guaranteeClock.id,
      label: `${guaranteeClock.label} · ${guaranteeClock.duration}`,
      meta: guaranteeClock.message,
      title: guaranteeClock.label,
      status: "pending",
    },
  ];
}
