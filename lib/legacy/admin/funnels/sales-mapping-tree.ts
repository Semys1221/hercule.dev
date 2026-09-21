import { getWizardObjectifsQuestions } from "@/components/legacy/internal/funnels/sales/sales-questions-objectifs-wizard";
import {
  getPitchSlides,
  type PitchSlideDefinition,
} from "@/components/legacy/internal/funnels/sales/sales-pitch-wizard-slides";
import type { SalesQuestion } from "@/components/legacy/internal/funnels/sales/sales-questions";
import {
  DASHBOARD_STEP_IDS,
  getDashboardRecoverySteps,
  getDashboardWizardSteps,
} from "@/lib/legacy/admin/funnels/sales-dashboard-wizard";
import { getRecoveryStepIds } from "@/lib/legacy/dashboard/closing-recovery";
import {
  getWizardMappingTitle,
  WIZARD_QUESTION_IDS,
  type WizardObjectifsQuestionId,
} from "@/lib/legacy/admin/funnels/sales-objectifs-wizard";
import {
  getPitchStepPart,
  PITCH_PART_LABELS,
  PITCH_STEP_IDS,
  type PitchWizardStepId,
} from "@/lib/legacy/admin/funnels/sales-pitch-wizard";
import {
  CLOSING_FIT_MIN_WHY_LENGTH,
  getClosingCommitOptions,
  getClosingFitOptions,
  getOnboardingFaq,
} from "@/lib/legacy/dashboard/onboarding-faq";
import {
  SESSION_MAPPING_DASHBOARD_GATE_CONDITION,
  SESSION_MAPPING_FLOW_OBJECTIFS_LABEL,
  SESSION_MAPPING_FLOW_SYSTEM_LABEL,
  SESSION_MAPPING_POST_SYSTEM_BRANCH,
  SESSION_MAPPING_SYSTEM_GATE_DESCRIPTION,
} from "@/lib/legacy/admin/funnels/ui-copy";
import type { Audience } from "@/lib/legacy/admin/navigation";

export type MappingFlowId = "discovery" | "pitch" | "dashboard";

export type MappingNodeKind = "question" | "gate";

export type MappingBranch = {
  label: string;
  targetId: string;
};

export type MappingNode = {
  id: string;
  kind: MappingNodeKind;
  title: string;
  condition?: string;
  branches: MappingBranch[];
};

export type MappingFlow = {
  id: MappingFlowId;
  label: string;
  rootId: string;
  nodes: Record<string, MappingNode>;
};

export type MappingFlowSegment =
  | { kind: "step"; id: string }
  | { kind: "split"; branches: Array<{ label: string; segments: MappingFlowSegment[] }> };

export type MappingNodeDetail = {
  id: string;
  flowId: MappingFlowId;
  title: string;
  prompt?: string;
  description?: string;
  type?: string;
  options?: Array<{ id: string; label: string }>;
  coachCue?: string;
  trainingNote?: string;
  part?: string;
  condition?: string;
  dynamicOptionsNote?: string;
  dynamicOptionsByMethod?: Array<{
    methodId: string;
    methodLabel: string;
    options: Array<{ id: string; label: string }>;
  }>;
};

const DISCOVERY_LINEAR_TRUNK = [
  "w1",
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w19",
  "w8",
  "w8Tried",
  "w8Brake",
  "w9",
  "w8Criteria",
  "w10",
  "w11",
  "w12",
  "w13",
] as const;

const PITCH_LINEAR_TRUNK = [
  "p0",
  "p2",
  "p3",
  "pGuarantee",
  "pCgv",
  "p4",
  "p5",
  "p7",
  "p9",
  "pRoi",
  "p11",
] as const;

const DASHBOARD_LINEAR_TRUNK = ["d0", "d1", "d2", "d3", "d4"] as const;

function stepSegments(ids: readonly string[]): MappingFlowSegment[] {
  return ids.map((id) => ({ kind: "step", id }));
}

function buildDiscoverySegments(): MappingFlowSegment[] {
  return [
    ...stepSegments(DISCOVERY_LINEAR_TRUNK),
    {
      kind: "split",
      branches: [
        {
          label: "w8Tried = looked ou tried",
          segments: [{ kind: "step", id: "w8TriedWho" }],
        },
        {
          label: "w8Tried = none",
          segments: [],
        },
      ],
    },
    { kind: "step", id: "wExchangeWhy13" },
    { kind: "step", id: "w13Why" },
    ...stepSegments(["w14", "wExchangeWhy14", "w15", "wExchangeWhy15"]),
    {
      kind: "split",
      branches: [
        {
          label: "w15 = wait ET w14 = 12m (pas d'urgence immédiate)",
          segments: [],
        },
        {
          label: "w15 = shortcut OU w14 ≠ 12m",
          segments: [
            { kind: "step", id: "w16" },
            {
              kind: "split",
              branches: [
                {
                  label: "w16 = strategic",
                  segments: stepSegments(["w16StrategicSub"]),
                },
                {
                  label: "w16 = resale",
                  segments: stepSegments(["w16ResaleSub"]),
                },
                {
                  label: "w16 = other",
                  segments: stepSegments(["w16Detail"]),
                },
              ],
            },
          ],
        },
      ],
    },
    ...stepSegments(["w18", "wExchangeWhy18", "w17"]),
    {
      kind: "step",
      id: "diagnostic_card",
    },
  ];
}

function buildPitchSegments(): MappingFlowSegment[] {
  return [
    { kind: "step", id: "pitch_gate" },
    ...stepSegments(PITCH_LINEAR_TRUNK),
    {
      kind: "split",
      branches: [
        {
          label: "p11TempCheck = hesitant OU p11WhyId absent",
          segments: [],
        },
        {
          label: "Oui + why ≥ 20 caractères",
          segments: stepSegments(["pDashboard"]),
        },
      ],
    },
  ];
}

function buildDashboardSegments(): MappingFlowSegment[] {
  const recoverySegments = stepSegments(getRecoveryStepIds());

  return [
    { kind: "step", id: "dashboard_gate" },
    ...stepSegments(DASHBOARD_LINEAR_TRUNK),
    { kind: "step", id: "d5Commit" },
    {
      kind: "split",
      branches: [
        {
          label: "commit = launch",
          segments: stepSegments(["d5Stripe"]),
        },
        {
          label: "commit = hesitate ET recoveryCycle = 0",
          segments: [
            ...recoverySegments,
            { kind: "step", id: "d5Commit" },
            {
              kind: "split",
              branches: [
                {
                  label: "2e hesitate (recoveryCycle = 1)",
                  segments: [
                    ...recoverySegments,
                    { kind: "step", id: "d5FinalCommit" },
                    { kind: "step", id: "d5Stripe" },
                  ],
                },
                {
                  label: "Je me lance après 1er recovery",
                  segments: stepSegments(["d5Stripe"]),
                },
              ],
            },
          ],
        },
        {
          label: "commit = hesitate ET recoveryCycle ≥ 2 (garde-fou)",
          segments: [
            { kind: "step", id: "d5FinalCommit" },
            { kind: "step", id: "d5Stripe" },
          ],
        },
      ],
    },
  ];
}

const DISCOVERY_NODE_CONDITIONS: Record<string, string> = {
  w8TriedWho: "Visible si w8Tried = looked ou tried",
  w9: "Visible si w8Brake renseigné",
  wExchangeWhy13: "Visible si w13 = yes",
  w13Why: "Visible si w13 = no",
  wExchangeWhy14: "Visible si w13 = yes et w14 ≠ 12m",
  wExchangeWhy15:
    "Visible si (w15 = wait et w14 = 12m) ou (w13 = yes et w15 = shortcut)",
  w16: "Visible si w15 = shortcut OU w14 ≠ 12m",
  w16StrategicSub: "Visible si w16 = strategic",
  w16ResaleSub: "Visible si w16 = resale",
  w16Detail: "Visible si w16 = other",
  wExchangeWhy18: "Visible si w18 = near_target ou at_capacity",
  diagnostic_card: "Visible si w17Acknowledged = true",
};

const PITCH_NODE_CONDITIONS: Record<string, string> = {
  pitch_gate: "bleedDiagnosticAccepted = true",
  p7FoundationBuyIn: "p7FoundationBuyIn = clear",
  p7BuyIn: "p7BuyIn = clear (activation mois 3)",
  pRoiAcknowledged: "pRoiAcknowledged = true",
  pDashboard: "Visible si p11WhyId renseigné et p11TempCheck ≠ hesitant",
  p12: "Retiré du live track — choix d'infrastructure sur le dashboard client",
};

const DASHBOARD_NODE_CONDITIONS: Record<string, string> = {
  dashboard_gate: SESSION_MAPPING_DASHBOARD_GATE_CONDITION,
  d3: `Suivant bloqué tant que fit + why ≥ ${CLOSING_FIT_MIN_WHY_LENGTH} car. + CGV acceptée`,
  d5Commit:
    "recoveryCycle < 2 — Je me lance / J'hésite encore (2 cycles recovery max)",
  d5FinalCommit:
    "recoveryCycle ≥ 2 — seul CTA « Prêt pour démarrer », pas d'option hésiter",
  d5Stripe: "launch OU finalCommitAccepted → checkout Stripe",
  "service-fit": "commit = hesitate ET recoveryCycle < 2",
  "service-why": "commit = hesitate ET recoveryCycle < 2",
  friction: "commit = hesitate ET recoveryCycle < 2",
  you: "commit = hesitate ET recoveryCycle < 2",
  company: "commit = hesitate ET recoveryCycle < 2",
  system: "commit = hesitate ET recoveryCycle < 2",
};

function collectNodeIdsFromSegments(segments: MappingFlowSegment[]): string[] {
  const ids: string[] = [];
  for (const segment of segments) {
    if (segment.kind === "step") {
      ids.push(segment.id);
      continue;
    }
    for (const branch of segment.branches) {
      ids.push(...collectNodeIdsFromSegments(branch.segments));
    }
  }
  return ids;
}

function buildDiscoveryNodes(audience: Audience): Record<string, MappingNode> {
  const questions = getWizardObjectifsQuestions(audience);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const nodes: Record<string, MappingNode> = {};

  for (const id of WIZARD_QUESTION_IDS) {
    const question = questionById.get(id);
    nodes[id] = {
      id,
      kind: "question",
      title: getWizardMappingTitle(id as WizardObjectifsQuestionId, audience, question?.prompt),
      condition: DISCOVERY_NODE_CONDITIONS[id],
      branches: [],
    };
  }

  return nodes;
}

function toDashboardFaqAudience(audience: Audience): "comptable" | "cif" {
  return audience === "cif" ? "cif" : "comptable";
}

function buildDashboardNodes(audience: Audience): Record<string, MappingNode> {
  const wizardSteps = getDashboardWizardSteps();
  const recoverySteps = getDashboardRecoverySteps();
  const nodes: Record<string, MappingNode> = {
    dashboard_gate: {
      id: "dashboard_gate",
      kind: "gate",
      title: "Lien dashboard requis",
      condition: DASHBOARD_NODE_CONDITIONS.dashboard_gate,
      branches: [{ label: SESSION_MAPPING_POST_SYSTEM_BRANCH, targetId: "d0" }],
    },
  };

  for (const step of wizardSteps) {
    nodes[step.id] = {
      id: step.id,
      kind: "question",
      title: step.title,
      condition: DASHBOARD_NODE_CONDITIONS[step.id],
      branches: [],
    };
  }

  for (const step of recoverySteps) {
    nodes[step.id] = {
      id: step.id,
      kind: "question",
      title: step.title,
      condition: DASHBOARD_NODE_CONDITIONS[step.id],
      branches: [],
    };
  }

  return nodes;
}

function buildPitchNodes(audience: Audience): Record<string, MappingNode> {
  const slides = getPitchSlides(audience);
  const slideById = new Map(slides.map((slide) => [slide.id, slide]));
  const nodes: Record<string, MappingNode> = {
    pitch_gate: {
      id: "pitch_gate",
      kind: "gate",
      title: "Diagnostic mentionné requis",
      condition: PITCH_NODE_CONDITIONS.pitch_gate,
      branches: [{ label: "bleedDiagnosticAccepted = true", targetId: "p0" }],
    },
  };

  for (const id of PITCH_STEP_IDS) {
    const slide = slideById.get(id);
    nodes[id] = {
      id,
      kind: "question",
      title: slide?.title ?? id,
      condition: PITCH_NODE_CONDITIONS[id],
      branches: [],
    };
  }

  return nodes;
}

export function getMappingFlowSegments(flowId: MappingFlowId): MappingFlowSegment[] {
  if (flowId === "discovery") {
    return buildDiscoverySegments();
  }
  if (flowId === "pitch") {
    return buildPitchSegments();
  }
  return buildDashboardSegments();
}

function getMappingFlowLabel(flowId: MappingFlowId): string {
  if (flowId === "discovery") {
    return SESSION_MAPPING_FLOW_OBJECTIFS_LABEL;
  }
  if (flowId === "pitch") {
    return SESSION_MAPPING_FLOW_SYSTEM_LABEL;
  }
  return "Dashboard";
}

function getMappingFlowRootId(flowId: MappingFlowId, nodeIds: string[]): string {
  if (nodeIds[0]) {
    return nodeIds[0];
  }
  if (flowId === "discovery") {
    return "w1";
  }
  if (flowId === "pitch") {
    return "pitch_gate";
  }
  return "dashboard_gate";
}

export function getMappingFlow(flowId: MappingFlowId, audience: Audience): MappingFlow {
  const segments = getMappingFlowSegments(flowId);
  const nodeIds = collectNodeIdsFromSegments(segments);
  const nodes =
    flowId === "discovery"
      ? buildDiscoveryNodes(audience)
      : flowId === "pitch"
        ? buildPitchNodes(audience)
        : buildDashboardNodes(audience);

  return {
    id: flowId,
    label: getMappingFlowLabel(flowId),
    rootId: getMappingFlowRootId(flowId, nodeIds),
    nodes,
  };
}

export function collectMappingNodeIds(flowId: MappingFlowId): string[] {
  const segments = getMappingFlowSegments(flowId);
  const fromSegments = collectNodeIdsFromSegments(segments);
  if (flowId === "discovery") {
    return [...new Set(fromSegments)];
  }
  if (flowId === "pitch") {
    return [...new Set(["pitch_gate", ...fromSegments])];
  }
  return [...new Set(["dashboard_gate", ...fromSegments, ...DASHBOARD_STEP_IDS])];
}

function getQuestionOptions(
  question: SalesQuestion,
): Array<{ id: string; label: string }> | undefined {
  if (question.type === "single" || question.type === "multi") {
    return question.options.map((option) => ({ id: option.id, label: option.label }));
  }
  return undefined;
}

export function getMappingNodeDetail(
  flowId: MappingFlowId,
  nodeId: string,
  audience: Audience,
): MappingNodeDetail | null {
  const flow = getMappingFlow(flowId, audience);
  const node = flow.nodes[nodeId];
  if (!node) {
    return null;
  }

  if (flowId === "discovery") {
    const questions = getWizardObjectifsQuestions(audience);
    const question = questions.find((item) => item.id === nodeId);
    if (!question && nodeId !== "diagnostic_card") {
      return {
        id: nodeId,
        flowId,
        title: node.title,
        condition: node.condition,
      };
    }

    const detail: MappingNodeDetail = {
      id: nodeId,
      flowId,
      title: node.title,
      prompt: question?.prompt,
      description: question?.description,
      type: question?.type,
      options: question ? getQuestionOptions(question) : undefined,
      coachCue: question?.coachCue,
      condition: node.condition,
    };

    if (question?.type === "acknowledgment" && "trapTemplate" in question) {
      detail.description = question.trapTemplate;
    }
    if (question?.type === "confirmation_mirror" && "mirrorTemplate" in question) {
      detail.description = question.mirrorTemplate;
    }
    if (question?.type === "diagnostic_card" && "mirrorTemplate" in question) {
      detail.description = question.mirrorTemplate;
    }

    return detail;
  }

  if (flowId === "dashboard") {
    if (nodeId === "dashboard_gate") {
      return {
        id: nodeId,
        flowId,
        title: node.title,
        type: "gate",
        condition: node.condition,
        description:
          "Le wizard de closing dashboard démarre quand le prospect ouvre le lien transmis à l'étape pDashboard.",
      };
    }

    const wizardStep = getDashboardWizardSteps().find((item) => item.id === nodeId);
    if (wizardStep) {
      const faqAudience = toDashboardFaqAudience(audience);
      const detail: MappingNodeDetail = {
        id: nodeId,
        flowId,
        title: wizardStep.title,
        type: wizardStep.type,
        coachCue: wizardStep.coachCue,
        trainingNote: wizardStep.trainingNote,
        condition: node.condition,
      };

      if (nodeId === "d3") {
        const faq = getOnboardingFaq(faqAudience);
        detail.description = faq.subtitle;
        detail.options = [
          ...faq.items.map((item) => ({ id: item.id, label: item.q })),
          ...getClosingFitOptions().map((option) => ({
            id: option.level,
            label: option.label,
          })),
        ];
      }

      if (nodeId === "d5Commit") {
        detail.options = getClosingCommitOptions().map((option) => ({
          id: option.level,
          label: option.label,
        }));
      }

      return detail;
    }

    const recoveryStep = getDashboardRecoverySteps().find((item) => item.id === nodeId);
    if (recoveryStep) {
      const detail: MappingNodeDetail = {
        id: nodeId,
        flowId,
        title: recoveryStep.title,
        type: recoveryStep.type,
        trainingNote: recoveryStep.trainingNote,
        condition: node.condition,
      };

      if (nodeId === "service-fit") {
        detail.options = [
          { id: "oui", label: "Oui, dans l'ensemble" },
          { id: "pas_encore", label: "Pas encore tout à fait" },
        ];
      }

      return detail;
    }

    return {
      id: nodeId,
      flowId,
      title: node.title,
      condition: node.condition,
    };
  }

  if (nodeId === "pitch_gate") {
    return {
      id: nodeId,
      flowId,
      title: node.title,
      type: "gate",
      condition: node.condition,
      description:
        SESSION_MAPPING_SYSTEM_GATE_DESCRIPTION,
    };
  }

  const slide = getPitchSlides(audience).find((item) => item.id === nodeId);
  if (!slide) {
    return {
      id: nodeId,
      flowId,
      title: node.title,
      condition: node.condition,
    };
  }

  const partId = getPitchStepPart(slide.id as PitchWizardStepId);

  return {
    id: nodeId,
    flowId,
    title: slide.title,
    type: slide.type,
    coachCue: slide.coachCue,
    trainingNote: slide.trainingNote,
    part: PITCH_PART_LABELS[partId],
    condition: node.condition,
  };
}

export function getPitchSlideTypeLabel(slide: PitchSlideDefinition): string {
  return slide.type.replace(/_/g, " ");
}
