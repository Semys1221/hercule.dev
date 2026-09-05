import type { FunnelScope, FunnelStep } from "@/lib/admin/funnels/schema";

export function buildStepContext(params: {
  scope: FunnelScope;
  layoutId: string | null;
  steps: FunnelStep[];
  currentStepId: string;
}): FunnelStep["context"] {
  const currentIndex = params.steps.findIndex((step) => step.id === params.currentStepId);
  const previousSteps = params.steps
    .slice(0, currentIndex)
    .filter((step) => step.name && step.description)
    .map((step) => ({
      id: step.id,
      name: step.name,
      description: step.description,
    }));

  return {
    audience: params.scope.audience,
    kind: params.scope.kind,
    stage: params.scope.stage,
    layoutId: params.layoutId,
    previousSteps,
  };
}
