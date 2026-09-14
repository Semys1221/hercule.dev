import {
  getVisibleWizardQuestionIds,
  type WizardObjectifsQuestionId,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import {
  getVisiblePitchStepIds,
  type PitchInterpolationContext,
  type PitchWizardStepId,
  usesPitchWizard,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

export type LiveTrackStepId = WizardObjectifsQuestionId | PitchWizardStepId;

export type LiveTrackSection = "objectifs" | "pitch";

export function getLiveTrackSection(stepId: LiveTrackStepId): LiveTrackSection {
  if (stepId.startsWith("w") || stepId === "diagnostic_card") {
    return "objectifs";
  }
  return "pitch";
}

export function getVisibleLiveTrackStepIds(
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
  options?: { developerMode?: boolean },
): LiveTrackStepId[] {
  const objectifsIds = getVisibleWizardQuestionIds(values);
  const developerMode = options?.developerMode ?? false;
  const pitchValues =
    developerMode && !usesPitchWizard(values)
      ? { ...values, bleedDiagnosticAccepted: true }
      : values;

  if (!usesPitchWizard(pitchValues)) {
    return objectifsIds;
  }

  const pitchIds = getVisiblePitchStepIds(pitchValues, audience, context);
  return [...objectifsIds, ...pitchIds];
}

export function findLiveTrackStepIndex(
  steps: LiveTrackStepId[],
  stepId: LiveTrackStepId,
): number {
  return steps.indexOf(stepId);
}

export function getLiveTrackSectionStartIndex(
  steps: LiveTrackStepId[],
  section: LiveTrackSection,
): number {
  return steps.findIndex((stepId) => getLiveTrackSection(stepId) === section);
}
