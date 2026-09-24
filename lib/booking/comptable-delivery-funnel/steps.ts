import type { FunnelPhase, FunnelStepId, StepKind } from "./schema";

export type FunnelStepDefinition = {
  id: FunnelStepId;
  kind: StepKind;
  phase: FunnelPhase;
  /** When true, user cannot continue without an answer in `answers[id]`. */
  requiresAnswer: boolean;
};

export const FUNNEL_STEP_ORDER: readonly FunnelStepId[] = [
  "intro",
  "profitability",
  "visibility",
  "accountant_situation",
  "intention",
  "education",
  "projection",
  "budget",
  "engagement",
  "calendly",
  "confirmation",
  "annual_revenue",
  "team_size",
  "meeting_priority",
  "free_text_problem",
  "mental_prep",
  "final_intention",
  "final_prep",
];

export const REQUIRED_PRE_CALENDLY_STEP_IDS: readonly FunnelStepId[] = [
  "profitability",
  "visibility",
  "accountant_situation",
  "intention",
  "projection",
  "budget",
  "engagement",
];

const STEP_DEFINITIONS: Record<FunnelStepId, Omit<FunnelStepDefinition, "id">> = {
  intro: { kind: "intro", phase: "pre_booking", requiresAnswer: false },
  profitability: {
    kind: "single_choice",
    phase: "pre_booking",
    requiresAnswer: true,
  },
  visibility: { kind: "single_choice", phase: "pre_booking", requiresAnswer: true },
  accountant_situation: {
    kind: "single_choice",
    phase: "pre_booking",
    requiresAnswer: true,
  },
  intention: { kind: "single_choice", phase: "pre_booking", requiresAnswer: true },
  education: { kind: "education", phase: "pre_booking", requiresAnswer: false },
  projection: { kind: "single_choice", phase: "pre_booking", requiresAnswer: true },
  budget: { kind: "single_choice", phase: "pre_booking", requiresAnswer: true },
  engagement: { kind: "single_choice", phase: "pre_booking", requiresAnswer: true },
  calendly: { kind: "calendly", phase: "pre_booking", requiresAnswer: false },
  confirmation: { kind: "confirmation", phase: "post_booking", requiresAnswer: false },
  annual_revenue: {
    kind: "single_choice",
    phase: "post_booking",
    requiresAnswer: true,
  },
  team_size: { kind: "single_choice", phase: "post_booking", requiresAnswer: true },
  meeting_priority: {
    kind: "single_choice",
    phase: "post_booking",
    requiresAnswer: true,
  },
  free_text_problem: {
    kind: "free_text",
    phase: "post_booking",
    requiresAnswer: true,
  },
  mental_prep: { kind: "education", phase: "post_booking", requiresAnswer: false },
  final_intention: {
    kind: "single_choice",
    phase: "post_booking",
    requiresAnswer: true,
  },
  final_prep: { kind: "checklist", phase: "post_booking", requiresAnswer: false },
};

export function getStepDefinition(stepId: FunnelStepId): FunnelStepDefinition {
  const def = STEP_DEFINITIONS[stepId];
  return { id: stepId, ...def };
}

export function stepIndex(stepId: FunnelStepId): number {
  return FUNNEL_STEP_ORDER.indexOf(stepId);
}
