import {
  PIPELINE_AVG_BASKET_EUR,
  type PipelineDashboardMetrics,
} from "@/lib/legacy/calendly/pipeline-dashboard";

import type { SegmentRow } from "./agence-revente-segment-bars";

export const PIPELINE_RDV_PER_DAY_TARGET = 2;

const PITCH_WELCOME_NAME_PLACEHOLDERS = new Set([
  "indépendant",
  "independant",
  "indépendante",
  "independante",
]);

export function formatPitchWelcomeName(companyName: string): string {
  const trimmed = companyName.trim();
  if (!trimmed) {
    return "";
  }
  if (PITCH_WELCOME_NAME_PLACEHOLDERS.has(trimmed.toLowerCase())) {
    return "";
  }
  return trimmed;
}

export function sumLastDailyHistory(
  metrics: PipelineDashboardMetrics,
  days = 10,
): number {
  return metrics.dailyHistory.slice(-days).reduce((sum, day) => sum + day.count, 0);
}

export const PRODUIT_PURCHASE_BULLETS = [
  "Accès illimité aux RDV du pipeline Comptable + CIF",
  "Qualification déjà renseignée (budget, effectif, objectif)",
  "Créneaux visio 30 min bookés dans Calendly",
  "Exclusivité : un seul grand compte propriétaire",
] as const;

export type PitchStep =
  | { kind: "produit_reveal"; revealIndex: number }
  | { kind: "capacite_pitch"; revealIndex: number };

export type CapaciteRevealBlock =
  | { type: "pipeline_rhythm" }
  | { type: "roi_monthly" }
  | { type: "calendly_cue" }
  | { type: "roi_recap" }
  | { type: "closing" };

/** Rythme + CA mensuel + Calendly + ROI recap + closing */
export const CAPACITE_REVEAL_BLOCK_COUNT = 5;

export type BusinessModelIcon = "cpu" | "banknote" | "calendar" | "userCheck";

export type BusinessModelStep = {
  label: string;
  icon: BusinessModelIcon;
  bullets?: readonly string[];
  tagline?: string;
};

export const BUSINESS_MODEL_STEPS: readonly BusinessModelStep[] = [
  {
    label: "Créer un pipeline de demande",
    icon: "cpu",
  },
  {
    label: "Budgétiser la niche et son engagement sur du long terme",
    icon: "banknote",
  },
  {
    label: "Planifier toutes les demandes de travail",
    icon: "calendar",
  },
  {
    label: "Trouver un acheteur avec une vision pour prendre le contrôle des demandes",
    icon: "userCheck",
  },
  {
    label:
      "Nous donner des directives en fonction de sa vision sur les tâches à réaliser pour ses clients",
    icon: "userCheck",
    bullets: [
      "Agrandissement du pipeline",
      "Gestion des relances automatiques",
      "Portail client",
      "Site web",
      "Google Ads",
    ],
    tagline: "Là où nous excellons.",
  },
];

/** Intro + 5 étapes modèle d'affaire */
export const BUSINESS_MODEL_BLOCK_COUNT = 1 + BUSINESS_MODEL_STEPS.length;

export type ProduitRevealBlock =
  | { type: "business_model_intro" }
  | { type: "business_model_step"; stepIndex: number }
  | { type: "accroche" }
  | { type: "kpi_bars"; rows: SegmentRow[]; headline?: string; subtitle?: string }
  | { type: "segment_bars"; rows: SegmentRow[]; headline: string; subtitle?: string }
  | { type: "purchase_header" }
  | { type: "purchase_bullet"; bullet: string; index: number };

/** Modèle d'affaire (6) + accroche + 3 KPI + 2 segment groups + header + 4 bullets */
export const PRODUIT_REVEAL_BLOCK_COUNT = 11 + BUSINESS_MODEL_BLOCK_COUNT;

export function getPitchSteps(): PitchStep[] {
  const produitReveals: PitchStep[] = Array.from(
    { length: PRODUIT_REVEAL_BLOCK_COUNT },
    (_, i) => ({
      kind: "produit_reveal",
      revealIndex: i,
    }),
  );

  const capaciteReveals: PitchStep[] = Array.from(
    { length: CAPACITE_REVEAL_BLOCK_COUNT },
    (_, i) => ({
      kind: "capacite_pitch",
      revealIndex: i,
    }),
  );

  return [...produitReveals, ...capaciteReveals];
}

export function buildCapaciteRevealBlocks(): CapaciteRevealBlock[] {
  return [
    { type: "pipeline_rhythm" },
    { type: "roi_monthly" },
    { type: "calendly_cue" },
    { type: "roi_recap" },
    { type: "closing" },
  ];
}

export function getVisibleCapaciteBlocks(revealIndex: number): CapaciteRevealBlock[] {
  const blocks = buildCapaciteRevealBlocks();
  if (revealIndex < 0) {
    return [];
  }
  return blocks.slice(0, revealIndex + 1);
}

export function buildProduitRevealBlocks(metrics: PipelineDashboardMetrics): ProduitRevealBlock[] {
  const stockCount = metrics.upcomingCount;
  const budgetDefined = metrics.activeCount - metrics.highlighted.budgetUndefined;
  const independentCount = metrics.segmentAggregates.reduce(
    (sum, aggregate) => sum + (aggregate.segment.isIndependent ? aggregate.count : 0),
    0,
  );
  const teamCount = metrics.activeCount - independentCount;
  const comptableCount = metrics.activeCount - metrics.highlighted.notComptable;
  const businessModelBlocks: ProduitRevealBlock[] = [
    { type: "business_model_intro" },
    ...BUSINESS_MODEL_STEPS.map((_, stepIndex) => ({
      type: "business_model_step" as const,
      stepIndex,
    })),
  ];
  const blocks: ProduitRevealBlock[] = [
    ...businessModelBlocks,
    { type: "accroche" },
    {
      type: "kpi_bars",
      headline: "Votre stock de RDV",
      subtitle: "Des créneaux déjà réservés, prêts à être traités.",
      rows: [
        {
          label: "RDV déjà bookés et prêts",
          value: stockCount,
          total: Math.max(stockCount, 1),
          className: "bg-primary",
        },
      ],
    },
    {
      type: "kpi_bars",
      headline: "Le rythme actuel",
      subtitle: "Un flux régulier qui alimente le pipeline.",
      rows: [
        {
          label: "RDV générés / jour ouvré",
          value: metrics.rdvPerActiveDay,
          total: PIPELINE_RDV_PER_DAY_TARGET,
          className: "bg-primary",
          displayValue: formatRdvPerDay(metrics.rdvPerActiveDay),
          hidePercent: true,
        },
      ],
    },
    {
      type: "kpi_bars",
      headline: "Budget moyen qualifié",
      subtitle: `${formatEuro(PIPELINE_AVG_BASKET_EUR)} en moyenne sur les profils actifs.`,
      rows: [
        {
          label: "Profils à 1 000 €+",
          value: budgetDefined,
          total: Math.max(metrics.activeCount, 1),
          className: "bg-violet-400",
        },
      ],
    },
    {
      type: "segment_bars",
      headline: "Qualité du stock",
      subtitle: `${stockCount} RDV à venir dans le pipeline.`,
      rows: [
        {
          label: "Cabinets comptables",
          value: comptableCount,
          total: Math.max(stockCount, metrics.activeCount, 1),
          className: "bg-violet-400",
        },
      ],
    },
    {
      type: "segment_bars",
      headline: "Diversité des profils",
      subtitle: "Un mix équilibré pour couvrir différents besoins.",
      rows: [
        {
          label: "Conseillers financiers (CIF)",
          value: metrics.highlighted.notComptable,
          total: Math.max(stockCount, metrics.activeCount, 1),
          className: "bg-cyan-400",
        },
        {
          label: "Structures (2+ salariés)",
          value: teamCount,
          total: Math.max(stockCount, metrics.activeCount, 1),
          className: "bg-primary",
        },
      ],
    },
    { type: "purchase_header" },
  ];

  for (let index = 0; index < PRODUIT_PURCHASE_BULLETS.length; index += 1) {
    blocks.push({
      type: "purchase_bullet",
      bullet: PRODUIT_PURCHASE_BULLETS[index],
      index,
    });
  }

  return blocks;
}

export function getVisibleProduitBlocks(
  metrics: PipelineDashboardMetrics,
  revealIndex: number,
): ProduitRevealBlock[] {
  const blocks = buildProduitRevealBlocks(metrics);
  if (revealIndex < 0) {
    return [];
  }
  return blocks.slice(0, revealIndex + 1);
}

export function produitBlockKey(block: ProduitRevealBlock, index: number): string {
  if (block.type === "business_model_step") {
    return `business-model-step-${block.stepIndex}`;
  }
  if (block.type === "purchase_bullet") {
    return `purchase-bullet-${block.index}`;
  }
  if (block.type === "kpi_bars" || block.type === "segment_bars") {
    return `${block.type}-${block.headline ?? index}`;
  }
  return `${block.type}-${index}`;
}

export function isSectionTransition(from: PitchStep | undefined, to: PitchStep): boolean {
  if (!from) {
    return false;
  }
  return (
    (from.kind === "produit_reveal" && to.kind === "capacite_pitch") ||
    (from.kind === "capacite_pitch" && to.kind === "produit_reveal")
  );
}

export function getStepTitle(step: PitchStep): string | undefined {
  if (step.kind === "produit_reveal") {
    return step.revealIndex < BUSINESS_MODEL_BLOCK_COUNT
      ? "Notre modèle d'affaire"
      : "Le produit aujourd'hui";
  }
  if (step.kind === "capacite_pitch") {
    const block = buildCapaciteRevealBlocks()[step.revealIndex];
    if (block?.type === "pipeline_rhythm" || block?.type === "roi_monthly") {
      return "Historique du pipeline";
    }
    if (block?.type === "roi_recap") {
      return "Votre ROI";
    }
    if (block?.type === "closing") {
      return "Prochaine étape";
    }
    return "Historique et capacité";
  }
  return undefined;
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRdvPerDay(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)} / jour`;
}
