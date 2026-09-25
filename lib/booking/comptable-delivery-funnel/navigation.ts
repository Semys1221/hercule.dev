import type { FunnelAnswers, FunnelPhase, FunnelStepId } from "./schema";
import {
  FUNNEL_STEP_ORDER,
  getStepDefinition,
  REQUIRED_PRE_CALENDLY_STEP_IDS,
  stepIndex,
} from "./steps";

export function getNextStepId(
  currentStepId: FunnelStepId,
  phase: FunnelPhase,
): FunnelStepId | null {
  const idx = stepIndex(currentStepId);
  if (idx < 0) return FUNNEL_STEP_ORDER[0] ?? null;

  for (let i = idx + 1; i < FUNNEL_STEP_ORDER.length; i++) {
    const candidate = FUNNEL_STEP_ORDER[i];
    const def = getStepDefinition(candidate);
    if (def.phase !== phase && phase === "pre_booking") {
      continue;
    }
    if (phase === "post_booking" && def.phase === "pre_booking") {
      continue;
    }
    return candidate;
  }
  return null;
}

export function getPrevStepId(
  currentStepId: FunnelStepId,
  phase: FunnelPhase,
): FunnelStepId | null {
  const idx = stepIndex(currentStepId);
  if (idx <= 0) return null;

  for (let i = idx - 1; i >= 0; i--) {
    const candidate = FUNNEL_STEP_ORDER[i];
    const def = getStepDefinition(candidate);
    if (phase === "pre_booking" && def.phase === "post_booking") {
      continue;
    }
    if (phase === "post_booking" && def.phase === "pre_booking") {
      if (candidate === "calendly") continue;
      if (def.phase === "pre_booking") continue;
    }
    return candidate;
  }
  return null;
}

export function isStepAnswered(
  stepId: FunnelStepId,
  answers: FunnelAnswers,
): boolean {
  const def = getStepDefinition(stepId);
  if (!def.requiresAnswer) return true;
  const value = answers[stepId];
  return typeof value === "string" && value.trim().length > 0;
}

export function isPreBookingComplete(answers: FunnelAnswers): boolean {
  return REQUIRED_PRE_CALENDLY_STEP_IDS.every((id) =>
    isStepAnswered(id, answers),
  );
}

export function canAccessCalendlyStep(answers: FunnelAnswers): boolean {
  return isPreBookingComplete(answers);
}

export function isPostBookingComplete(answers: FunnelAnswers): boolean {
  const postRequired: FunnelStepId[] = [
    "annual_revenue",
    "team_size",
    "meeting_priority",
    "free_text_problem",
    "final_intention",
  ];
  return postRequired.every((id) => isStepAnswered(id, answers));
}

export function resolvePhaseForStep(stepId: FunnelStepId): FunnelPhase {
  return getStepDefinition(stepId).phase;
}

/** Merge server and local funnel state; keeps the more advanced step and union of answers. */
export function mergeFunnelState(
  server: {
    currentStepId: FunnelStepId;
    phase: FunnelPhase;
    answers: FunnelAnswers;
  },
  local: {
    currentStepId: FunnelStepId;
    phase: FunnelPhase;
    answers: FunnelAnswers;
  },
): {
  currentStepId: FunnelStepId;
  phase: FunnelPhase;
  answers: FunnelAnswers;
} {
  const serverIdx = stepIndex(server.currentStepId);
  const localIdx = stepIndex(local.currentStepId);
  const phase =
    local.phase === "post_booking" || server.phase === "post_booking"
      ? "post_booking"
      : "pre_booking";
  const currentStepId =
    localIdx > serverIdx ? local.currentStepId : server.currentStepId;
  return {
    currentStepId,
    phase,
    answers: { ...server.answers, ...local.answers },
  };
}
