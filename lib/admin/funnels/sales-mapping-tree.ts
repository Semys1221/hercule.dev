import { getWizardObjectifsQuestions } from "@/components/internal/funnels/sales/sales-questions-objectifs-wizard";
import {
  getPitchSlides,
  type PitchSlideDefinition,
} from "@/components/internal/funnels/sales/sales-pitch-wizard-slides";
import type { SalesQuestion } from "@/components/internal/funnels/sales/sales-questions";
import { B5_METHOD_OPTIONS } from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  getW8BrakeOptions,
  WIZARD_QUESTION_IDS,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import {
  getPitchStepPart,
  PITCH_PART_LABELS,
  PITCH_STEP_IDS,
  type PitchWizardStepId,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

export type MappingFlowId = "discovery" | "pitch";

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
  "w8",
  "w8Tried",
] as const;

const PITCH_LINEAR_TRUNK = [
  "p0",
  "p1",
  "p1b",
  "p2",
  "p3",
  "pCgv",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "p10",
  "pRoi",
  "p11",
] as const;

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
          label: "w8Tried = none (pas exploré)",
          segments: [],
        },
        {
          label: "w8Tried ≠ none",
          segments: stepSegments(["w8TriedWho"]),
        },
      ],
    },
    ...stepSegments(["w8Criteria", "w8Brake", "w9", "w10", "w11", "w12", "w13"]),
    {
      kind: "step",
      id: "w13Why",
    },
    ...stepSegments(["w14", "w15"]),
    {
      kind: "split",
      branches: [
        {
          label: "w15 = wait ET w14 = 12m (pas d'urgence)",
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
                  label: "w16 ≠ other",
                  segments: [],
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
    ...stepSegments(["w18", "w17"]),
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
          segments: stepSegments(["p12", "pDashboard"]),
        },
      ],
    },
  ];
}

const DISCOVERY_NODE_CONDITIONS: Record<string, string> = {
  w8TriedWho: "Visible si w8Tried est renseigné et ≠ none",
  w13Why: "Visible si w13 est renseigné",
  w16: "Visible si w15 = shortcut OU w14 ≠ 12m",
  w16Detail: "Visible si w16 = other",
  diagnostic_card: "Visible si w17Acknowledged = true",
  w8Brake: "Options dynamiques selon la méthode w8",
};

const PITCH_NODE_CONDITIONS: Record<string, string> = {
  pitch_gate: "bleedDiagnosticAccepted = true",
  p7FoundationBuyIn: "p7FoundationBuyIn = clear",
  p7BuyIn: "p7BuyIn = clear (activation mois 3)",
  pRoiAcknowledged: "pRoiAcknowledged = true",
  pDashboard: "Visible si p11WhyId renseigné et p11TempCheck ≠ hesitant",
  p12: "Visible si p11WhyId renseigné et p11TempCheck ≠ hesitant",
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
      title: question?.prompt ?? id,
      condition: DISCOVERY_NODE_CONDITIONS[id],
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
      title: "Diagnostic signé requis",
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
  return flowId === "discovery" ? buildDiscoverySegments() : buildPitchSegments();
}

export function getMappingFlow(flowId: MappingFlowId, audience: Audience): MappingFlow {
  const segments = getMappingFlowSegments(flowId);
  const nodeIds = collectNodeIdsFromSegments(segments);
  const nodes =
    flowId === "discovery" ? buildDiscoveryNodes(audience) : buildPitchNodes(audience);

  return {
    id: flowId,
    label: flowId === "discovery" ? "Discovery" : "Pitch",
    rootId: nodeIds[0] ?? (flowId === "discovery" ? "w1" : "pitch_gate"),
    nodes,
  };
}

export function collectMappingNodeIds(flowId: MappingFlowId): string[] {
  const segments = getMappingFlowSegments(flowId);
  const fromSegments = collectNodeIdsFromSegments(segments);
  if (flowId === "discovery") {
    return [...new Set(fromSegments)];
  }
  return [...new Set(["pitch_gate", ...fromSegments])];
}

function getQuestionOptions(
  question: SalesQuestion,
): Array<{ id: string; label: string }> | undefined {
  if (question.type === "single" || question.type === "multi") {
    return question.options.map((option) => ({ id: option.id, label: option.label }));
  }
  return undefined;
}

function getW8BrakeDynamicOptions(): MappingNodeDetail["dynamicOptionsByMethod"] {
  return B5_METHOD_OPTIONS.map((method) => ({
    methodId: method.id,
    methodLabel: method.label,
    options: getW8BrakeOptions({ w8: method.id } as SalesQualificationValues).map(
      (option) => ({ id: option.id, label: option.label }),
    ),
  }));
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

    if (nodeId === "w8Brake") {
      detail.dynamicOptionsNote =
        "Les freins affichés dépendent de la méthode d'acquisition sélectionnée (w8).";
      detail.dynamicOptionsByMethod = getW8BrakeDynamicOptions();
    }

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

  if (nodeId === "pitch_gate") {
    return {
      id: nodeId,
      flowId,
      title: node.title,
      type: "gate",
      condition: node.condition,
      description:
        "Le wizard pitch ne démarre qu'après validation du diagnostic bleed (bleedDiagnosticAccepted).",
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
