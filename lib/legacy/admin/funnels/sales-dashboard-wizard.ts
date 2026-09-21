import {
  getRecoveryStepIds,
  RECOVERY_DIAGNOSTIC_STEP_IDS,
  RECOVERY_MAX_CYCLES,
  RECOVERY_PITCH_STEP_IDS,
  type RecoveryStepId,
} from "@/lib/legacy/dashboard/closing-recovery";
import { parseDashboardClosing } from "@/lib/legacy/dashboard/closing-state";
import {
  CLOSING_FIT_MIN_WHY_LENGTH,
  isClosingFitWhyValid,
} from "@/lib/legacy/dashboard/onboarding-faq";
import type { DashboardClosingState } from "@/lib/legacy/dashboard/types";
import type { Audience } from "@/lib/legacy/admin/navigation";

export const DASHBOARD_WIZARD_SUBTITLE =
  "Partage d'écran, prévisualisation du tableau de bord, validation des objections, choix d'infrastructure et paiement Stripe.";

export const DASHBOARD_STEP_IDS = [
  "d0",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5Commit",
  "d5FinalCommit",
  "d5Stripe",
] as const;

export type DashboardWizardStepId = (typeof DASHBOARD_STEP_IDS)[number];

export type DashboardMappingStepId =
  | DashboardWizardStepId
  | RecoveryStepId
  | "dashboard_gate";

export type DashboardWizardStepDefinition = {
  id: DashboardWizardStepId;
  type: string;
  title: string;
  coachCue?: string;
  trainingNote?: string;
};

export type DashboardRecoveryStepDefinition = {
  id: RecoveryStepId;
  type: string;
  title: string;
  trainingNote?: string;
};

export type DashboardMappingVisibilityState = {
  tieDownAccepted?: boolean;
  stripeRevealed?: boolean;
  closing?: Partial<DashboardClosingState>;
};

const DASHBOARD_STEP_DEFINITIONS: DashboardWizardStepDefinition[] = [
  {
    id: "d0",
    type: "screen_share",
    title: "Partage d'écran",
    coachCue: "Partage d'écran du tableau de bord cabinet.",
  },
  {
    id: "d1",
    type: "dashboard_preview",
    title: "Votre tableau de bord",
    coachCue: "Prévisualisation de la chronologie d'activation — espace réel après paiement.",
  },
  {
    id: "d2",
    type: "form_preview",
    title: "Votre profil cabinet",
    coachCue: "Profil cabinet en lecture seule — données collectées pendant la session.",
  },
  {
    id: "d3",
    type: "faq_fit",
    title: "Questions fréquentes",
    coachCue: "Objections courantes, alignement service et validation des conditions générales.",
  },
  {
    id: "d4",
    type: "pricing",
    title: "Choix d'infrastructure",
    coachCue: "Grille Core / Horizon — formule recommandée selon le profil cabinet.",
  },
  {
    id: "d5Commit",
    type: "commit",
    title: "Prêt à activer ?",
    coachCue: "Confirmation d'activation ou demande de précisions complémentaires.",
  },
  {
    id: "d5FinalCommit",
    type: "final_commit",
    title: "Prêt pour démarrer",
    coachCue: "Dernière confirmation avant le passage au paiement.",
  },
  {
    id: "d5Stripe",
    type: "checkout",
    title: "Paiement Stripe",
    coachCue: "Paiement Stripe — activation de la zone exclusive après validation.",
  },
];

const RECOVERY_STEP_DEFINITIONS: DashboardRecoveryStepDefinition[] = [
  {
    id: "service-fit",
    type: "recovery_diagnostic",
    title: "Alignement service",
  },
  {
    id: "service-why",
    type: "recovery_diagnostic",
    title: "Impression sur le service",
  },
  {
    id: "friction",
    type: "recovery_diagnostic",
    title: "Point de friction",
  },
  {
    id: "you",
    type: "recovery_pitch",
    title: "Cadre déjà posé",
  },
  {
    id: "company",
    type: "recovery_pitch",
    title: "Le cadre Hercule",
  },
  {
    id: "system",
    type: "recovery_pitch",
    title: "Le système Hercule",
  },
];

export function getDashboardWizardSteps(): DashboardWizardStepDefinition[] {
  return DASHBOARD_STEP_DEFINITIONS;
}

export function getDashboardRecoverySteps(): DashboardRecoveryStepDefinition[] {
  return RECOVERY_STEP_DEFINITIONS;
}

export function getDashboardRecoveryStepIds(): RecoveryStepId[] {
  return getRecoveryStepIds();
}

export function isCabinetDashboardAudience(audience: Audience): boolean {
  return audience === "comptable" || audience === "cif";
}

export function usesDashboardClosingWizard(audience: Audience): boolean {
  return isCabinetDashboardAudience(audience);
}

function resolveClosingState(
  state: DashboardMappingVisibilityState,
): DashboardClosingState {
  return parseDashboardClosing(state.closing);
}

export function isDashboardFaqStepComplete(state: DashboardMappingVisibilityState): boolean {
  const closing = resolveClosingState(state);
  return (
    Boolean(closing.fit) &&
    isClosingFitWhyValid(closing.fitWhy) &&
    state.tieDownAccepted === true
  );
}

export function isDashboardStepVisible(
  stepId: DashboardMappingStepId,
  state: DashboardMappingVisibilityState,
): boolean {
  const closing = resolveClosingState(state);

  if (stepId === "dashboard_gate") {
    return true;
  }

  if ((DASHBOARD_STEP_IDS as readonly string[]).includes(stepId)) {
    if (stepId === "d5Commit") {
      return (
        state.stripeRevealed !== true &&
        closing.recoveryCycle < RECOVERY_MAX_CYCLES &&
        !closing.finalCommitAccepted
      );
    }
    if (stepId === "d5FinalCommit") {
      return (
        state.stripeRevealed !== true &&
        closing.recoveryCycle >= RECOVERY_MAX_CYCLES &&
        !closing.finalCommitAccepted
      );
    }
    if (stepId === "d5Stripe") {
      return state.stripeRevealed === true || closing.finalCommitAccepted;
    }
    return true;
  }

  if ((getRecoveryStepIds() as readonly string[]).includes(stepId as RecoveryStepId)) {
    if (closing.commit !== "hesitate") {
      return false;
    }
    if (closing.recoveryCycle >= RECOVERY_MAX_CYCLES) {
      return false;
    }
    return true;
  }

  return false;
}

export function getVisibleDashboardStepIds(
  state: DashboardMappingVisibilityState,
): DashboardMappingStepId[] {
  const linearIds: DashboardMappingStepId[] = [
    "dashboard_gate",
    ...DASHBOARD_STEP_IDS,
  ];
  const recoveryIds = getRecoveryStepIds();
  const closing = resolveClosingState(state);

  const ids: DashboardMappingStepId[] = linearIds.filter((id) =>
    isDashboardStepVisible(id, state),
  );

  if (
    closing.commit === "hesitate" &&
    closing.recoveryCycle < RECOVERY_MAX_CYCLES
  ) {
    for (const recoveryId of recoveryIds) {
      if (isDashboardStepVisible(recoveryId, state)) {
        ids.push(recoveryId);
      }
    }
  }

  if (isDashboardStepVisible("d5Stripe", state)) {
    ids.push("d5Stripe");
  }

  return [...new Set(ids)];
}

export { RECOVERY_DIAGNOSTIC_STEP_IDS, RECOVERY_PITCH_STEP_IDS, CLOSING_FIT_MIN_WHY_LENGTH };
