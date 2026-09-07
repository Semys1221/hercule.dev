import type { TimelineStep } from "@/lib/dashboard/types";

import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";

export function normalizeTimelineSteps(timeline: TimelineStep[] | undefined): TimelineStep[] {
  if (!timeline || timeline.length === 0) {
    return DEFAULT_TIMELINE.map((step) => ({ ...step }));
  }
  return timeline.map((step) => ({ ...step }));
}

/** First step becomes active (search started). */
export function timelineForSearchStarted(steps: TimelineStep[]): TimelineStep[] {
  const next = normalizeTimelineSteps(steps);
  if (next.length === 0) return next;

  return next.map((step, index) => {
    if (index === 0) {
      return { ...step, status: "active" };
    }
    if (step.status === "active") {
      return { ...step, status: "pending" };
    }
    return step;
  });
}

/** Advance: first pending → done, next pending → active. */
export function timelineForMilestone(steps: TimelineStep[]): TimelineStep[] {
  const next = normalizeTimelineSteps(steps);
  const pendingIndex = next.findIndex((step) => step.status === "pending");
  if (pendingIndex === -1) {
    return next;
  }

  next[pendingIndex] = { ...next[pendingIndex], status: "done" };

  const nextPendingIndex = next.findIndex((step) => step.status === "pending");
  if (nextPendingIndex !== -1) {
    next[nextPendingIndex] = { ...next[nextPendingIndex], status: "active" };
  }

  return next;
}
