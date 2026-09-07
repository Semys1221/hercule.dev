"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { TimelineStep } from "@/lib/dashboard/types";

export type ChronologieStep = {
  id: string;
  label: string;
  meta?: string;
  status: TimelineStep["status"];
};

type FillAnimation = "default" | "reload";

type ChronologieSectionProps = {
  steps: ChronologieStep[];
  animated?: boolean;
  description?: string;
  activeStatusLabel?: string;
  fillAnimation?: FillAnimation;
  layout?: "vertical" | "horizontal";
  showHeader?: boolean;
};

const RELOAD_FILL_DURATION = 2;
const RELOAD_FILL_INITIAL_DELAY = 0.6;

function connectorFillTransition(
  index: number,
  fillAnimation: FillAnimation,
): { delay: number; duration: number; ease: "easeOut" | "easeInOut" } {
  if (fillAnimation === "reload") {
    return {
      delay: RELOAD_FILL_INITIAL_DELAY + index * RELOAD_FILL_DURATION,
      duration: RELOAD_FILL_DURATION,
      ease: "easeInOut",
    };
  }

  return {
    delay: 0.12 + index * 0.12,
    duration: 0.45,
    ease: "easeOut",
  };
}

function stepRevealTransition(
  index: number,
  fillAnimation: FillAnimation,
): { delay: number; duration: number } {
  if (fillAnimation === "reload") {
    return {
      delay: RELOAD_FILL_INITIAL_DELAY + index * RELOAD_FILL_DURATION * 0.9,
      duration: 0.55,
    };
  }

  return {
    delay: index * 0.12,
    duration: 0.3,
  };
}

function shouldAnimateConnectorFill(
  step: ChronologieStep,
  fillAnimation: FillAnimation,
): boolean {
  if (fillAnimation === "reload") {
    return true;
  }

  return step.status === "done" || step.status === "active";
}

function stepMetaLabel(step: ChronologieStep): string | null {
  if (step.meta) return step.meta;
  if (step.status === "done") return "Terminé";
  if (step.status === "pending") return "À venir";
  return null;
}

function dotColorClass(
  status: TimelineStep["status"],
  fillAnimation: FillAnimation,
): string {
  if (status === "done") {
    return "bg-emerald-500";
  }

  if (status === "active" || (fillAnimation === "reload" && status === "pending")) {
    return "bg-primary";
  }

  return "bg-border";
}

function stepLabelClass(
  status: TimelineStep["status"],
  fillAnimation: FillAnimation,
): string {
  if (fillAnimation === "reload") {
    return "";
  }

  return status === "pending" ? "text-muted-foreground" : "";
}

function TimelineDot({
  status,
  pulse,
  fillAnimation = "default",
}: {
  status: TimelineStep["status"];
  pulse: boolean;
  fillAnimation?: FillAnimation;
}) {
  const colorClass = dotColorClass(status, fillAnimation);

  if (pulse && status === "active") {
    return (
      <motion.span
        className={`flex size-3 shrink-0 rounded-full ring-2 ring-background ${colorClass}`}
        animate={{ opacity: [0.72, 1, 0.72], scale: [1, 1.12, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      />
    );
  }

  return (
    <span
      className={`flex size-3 shrink-0 rounded-full ring-2 ring-background ${colorClass}`}
    />
  );
}

function connectorColor(
  leftStep: ChronologieStep,
  rightStep: ChronologieStep,
  fillAnimation: FillAnimation = "default",
): string {
  if (fillAnimation === "reload") {
    if (leftStep.status === "done") {
      return "bg-emerald-500";
    }

    return "bg-primary/60";
  }

  if (leftStep.status === "done" && rightStep.status !== "pending") {
    return "bg-emerald-500";
  }
  if (leftStep.status === "done" || leftStep.status === "active") {
    return "bg-primary/60";
  }
  return "bg-border";
}

function HorizontalTimeline({
  steps,
  shouldAnimate,
  activeStatusLabel,
  fillAnimation,
}: {
  steps: ChronologieStep[];
  shouldAnimate: boolean;
  activeStatusLabel: string;
  fillAnimation: FillAnimation;
}) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, index) => {
        const meta = stepMetaLabel(step);
        const isLast = index === steps.length - 1;
        const nextStep = steps[index + 1];
        const ListItem = shouldAnimate ? motion.li : "li";
        const listItemProps = shouldAnimate
          ? {
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: stepRevealTransition(index, fillAnimation),
            }
          : {};

        return (
          <ListItem
            key={step.id}
            className="flex min-w-0 flex-1 items-start last:flex-none"
            {...listItemProps}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <TimelineDot
                status={step.status}
                pulse={shouldAnimate}
                fillAnimation={fillAnimation}
              />
              <p
                className={`mt-2 w-full px-1 text-center text-xs font-medium leading-tight ${stepLabelClass(step.status, fillAnimation)}`}
              >
                {step.label}
              </p>
              {meta ? (
                <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
                  {meta}
                </p>
              ) : null}
              {step.status === "active" && shouldAnimate ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mt-0.5 text-center text-[10px] text-primary"
                >
                  {activeStatusLabel}
                </motion.p>
              ) : step.status === "active" ? (
                <p className="mt-0.5 text-center text-[10px] text-primary">
                  {activeStatusLabel}
                </p>
              ) : null}
            </div>

            {!isLast && nextStep ? (
              <div className="relative mt-1.5 h-0.5 min-w-[12px] flex-1 self-start overflow-hidden rounded-full bg-border">
                {shouldAnimate && shouldAnimateConnectorFill(step, fillAnimation) ? (
                  <motion.span
                    className={`absolute inset-y-0 left-0 rounded-full ${connectorColor(step, nextStep, fillAnimation)}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={connectorFillTransition(index, fillAnimation)}
                  />
                ) : (
                  <span
                    className={`absolute inset-y-0 left-0 w-full rounded-full ${
                      shouldAnimateConnectorFill(step, fillAnimation)
                        ? connectorColor(step, nextStep, fillAnimation)
                        : "bg-border"
                    }`}
                  />
                )}
              </div>
            ) : null}
          </ListItem>
        );
      })}
    </ol>
  );
}

function VerticalTimeline({
  steps,
  shouldAnimate,
  activeStatusLabel,
}: {
  steps: ChronologieStep[];
  shouldAnimate: boolean;
  activeStatusLabel: string;
}) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const meta = stepMetaLabel(step);
        const ListItem = shouldAnimate ? motion.li : "li";
        const listItemProps = shouldAnimate
          ? {
              initial: { opacity: 0, x: -12 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: index * 0.12, duration: 0.3 },
            }
          : {};

        return (
          <ListItem
            key={step.id}
            className="flex gap-4 pb-6 last:pb-0"
            {...listItemProps}
          >
            <div className="flex flex-col items-center">
              <TimelineDot status={step.status} pulse={shouldAnimate} />
              {index < steps.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>

            <div className="min-w-0 pb-1">
              <p
                className={`font-medium ${
                  step.status === "pending" ? "text-muted-foreground" : ""
                }`}
              >
                {step.label}
              </p>
              {meta ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{meta}</p>
              ) : null}
              {step.status === "active" && shouldAnimate ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mt-0.5 text-xs text-primary"
                >
                  {activeStatusLabel}
                </motion.p>
              ) : step.status === "active" ? (
                <p className="mt-0.5 text-xs text-primary">{activeStatusLabel}</p>
              ) : null}
            </div>
          </ListItem>
        );
      })}
    </ol>
  );
}

export function ChronologieSection({
  steps,
  animated = true,
  description,
  activeStatusLabel = "En recherche active",
  fillAnimation = "default",
  layout = "vertical",
  showHeader = true,
}: ChronologieSectionProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animated && !reducedMotion;

  if (steps.length === 0) {
    return null;
  }

  const isHorizontal = layout === "horizontal";

  return (
    <section className={showHeader ? "mt-6" : ""}>
      {showHeader ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`size-2 shrink-0 rounded-full bg-emerald-500/70 ${
              reducedMotion ? "" : "animate-pulse"
            }`}
            aria-hidden
          />
          <h2 className="text-lg font-medium">Chronologie</h2>
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Surveillance
          </span>
        </div>
      ) : null}
      {description ? (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      ) : null}

      {isHorizontal ? (
        <HorizontalTimeline
          steps={steps}
          shouldAnimate={shouldAnimate}
          activeStatusLabel={activeStatusLabel}
          fillAnimation={fillAnimation}
        />
      ) : (
        <VerticalTimeline
          steps={steps}
          shouldAnimate={shouldAnimate}
          activeStatusLabel={activeStatusLabel}
        />
      )}
    </section>
  );
}
