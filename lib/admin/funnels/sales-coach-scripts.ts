import {
  COMPTABLE_DIFFERENTIATOR_OPTIONS,
  formatFoundationRoiScript,
  FOUNDATION_ROI_DISPLAY,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_DIFFERENTIATOR_OPTIONS } from "@/lib/admin/funnels/cif-sales-copy";
import {
  isCabinetBuyerSalesAudience,
  isCifSalesAudience,
} from "@/lib/admin/funnels/sales-audience";
import { interpolateClientSegment, type ClientSegment } from "@/lib/admin/funnels/client-segment";
import type { Audience } from "@/lib/admin/navigation";

import type { SalesQuestion } from "@/components/internal/funnels/sales/sales-questions";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export type SalesCoachContext = {
  audience: Audience;
  firstName: string;
  clientSegment: ClientSegment;
  questionId: string;
  selectedOptionIds?: string[];
  sliderValue?: number | null;
  o3Value?: string;
  o6Value?: string;
  bleedCause?: string;
};

export type HonorairesRoiAnchoring = {
  horizonMonthlyEur: number;
  investment90DaysEur: number;
  guaranteeMrrEur: number;
  yearOneValueEur: number;
  script: string;
};

function formatEuros(value: number): string {
  return `${euroFormatter.format(value)} €`;
}

function getObjectifsQuestions(audience: Audience): SalesQuestion[] {
  if (isCifSalesAudience(audience)) {
    // Lazy import avoids circular dependency with sales-bleed-tunnel at module init.
    const { CIF_OBJECTIFS_QUESTIONS } =
      require("@/components/internal/funnels/sales/sales-questions-objectifs-cif") as {
        CIF_OBJECTIFS_QUESTIONS: SalesQuestion[];
      };
    return CIF_OBJECTIFS_QUESTIONS;
  }

  const { COMPTABLE_OBJECTIFS_QUESTIONS } =
    require("@/components/internal/funnels/sales/sales-questions-objectifs-comptable") as {
      COMPTABLE_OBJECTIFS_QUESTIONS: SalesQuestion[];
    };
  return COMPTABLE_OBJECTIFS_QUESTIONS;
}

function getOptionLabel(
  audience: Audience,
  questionId: string,
  optionId: string,
): string | null {
  const question = getObjectifsQuestions(audience).find((entry) => entry.id === questionId);
  const option = question?.options?.find((entry) => entry.id === optionId);
  return option?.label ?? null;
}

function getDifferentiatorLabels(audience: Audience, optionIds: string[]): string[] {
  const options = isCifSalesAudience(audience)
    ? CIF_DIFFERENTIATOR_OPTIONS
    : COMPTABLE_DIFFERENTIATOR_OPTIONS;

  return optionIds
    .map((id) => options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));
}

function formatAtoutList(labels: string[]): string {
  if (labels.length === 0) {
    return "vos atouts déclarés";
  }
  if (labels.length === 1) {
    return labels[0];
  }
  if (labels.length === 2) {
    return `${labels[0]} et ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(", ")} et ${labels.at(-1)}`;
}

function cabinetNoun(audience: Audience): string {
  return isCifSalesAudience(audience) ? "mandats" : "dossiers";
}

export function computeHonorairesRoiAnchoring(
  annualHonorairesEur: number,
  cause = "l'écart déclaré",
): HonorairesRoiAnchoring {
  const script = [
    `Ticket Horizon : **${formatEuros(FOUNDATION_ROI_DISPLAY.horizonMonthlyEur)}**/mois.`,
    `Investissement 90 j : **${formatEuros(FOUNDATION_ROI_DISPLAY.investment90DaysEur)}**.`,
    `Garantie : **${formatEuros(FOUNDATION_ROI_DISPLAY.guaranteeMrrEur)}** de récurrent cumulé.`,
    `Valeur année 1 : **${formatEuros(FOUNDATION_ROI_DISPLAY.yearOneValueEur)}**.`,
    formatFoundationRoiScript(annualHonorairesEur, cause),
  ].join(" ");

  return {
    horizonMonthlyEur: FOUNDATION_ROI_DISPLAY.horizonMonthlyEur,
    investment90DaysEur: FOUNDATION_ROI_DISPLAY.investment90DaysEur,
    guaranteeMrrEur: FOUNDATION_ROI_DISPLAY.guaranteeMrrEur,
    yearOneValueEur: FOUNDATION_ROI_DISPLAY.yearOneValueEur,
    script,
  };
}

function buildO3Script(context: SalesCoachContext): string | null {
  if (!context.o3Value) {
    return null;
  }

  const cause =
    context.bleedCause ||
    (context.o3Value ? getOptionLabel(context.audience, "o3", context.o3Value) : null) ||
    "cette cause";
  const firstName = context.firstName;

  return interpolateClientSegment(
    `${firstName}, le cabinet coche **${cause}**. Depuis combien de temps cette invisibilité de zone pèse sur le portefeuille ?`,
    context.clientSegment,
  );
}

function buildO4Script(context: SalesCoachContext): string | null {
  if (!context.selectedOptionIds?.length) {
    return null;
  }

  const cabinetLabel = isCifSalesAudience(context.audience) ? "cabinet" : "cabinet";

  return interpolateClientSegment(
    `Parmi ces freins, lequel bride le plus la capacité du ${cabinetLabel} sur les 6 prochains mois ?`,
    context.clientSegment,
  );
}

function buildO6Script(context: SalesCoachContext): string | null {
  if (context.o6Value !== "major_gap" && context.o6Value !== "significant_gap") {
    return null;
  }

  return interpolateClientSegment(
    `${context.firstName}, si dans 6 mois aucune infrastructure n'est en place : qu'est-ce que ça fait à la marge et à l'occupation du cabinet ?`,
    context.clientSegment,
  );
}

function buildHistoriqueEmpathyIntro(context: SalesCoachContext): string {
  const noun = cabinetNoun(context.audience);

  return interpolateClientSegment(
    `${context.firstName}, on arrive sur la fiabilité de production — ce n'est pas une compétition ni un audit blâmant. On veut comprendre comment le cabinet gère la charge sur les ${noun} {clientSegment}, pour calibrer les demandes inbound qu'on vous enverra. Soyez transparents : c'est ce qui protège la relation cabinet-dirigeant.`,
    context.clientSegment,
  );
}

function buildQ21Script(context: SalesCoachContext): string | null {
  const selected = context.selectedOptionIds ?? [];
  if (selected.length === 0) {
    return null;
  }

  const atout = formatAtoutList(getDifferentiatorLabels(context.audience, selected));
  const cause =
    (context.o3Value
      ? getOptionLabel(context.audience, "o3", context.o3Value)
      : null) ?? "l'écart déclaré";

  return interpolateClientSegment(
    `Le cabinet se distingue sur **${atout}**. Foundation aligne la capture de zone sur ce positionnement pour traiter **${cause}** — les dirigeants qui initient arrivent déjà sur ce profil.`,
    context.clientSegment,
  );
}

function buildQ13Script(
  context: SalesCoachContext,
  annualMin: number,
): string | null {
  if (typeof context.sliderValue !== "number" || context.sliderValue < annualMin) {
    return null;
  }

  const cause = context.bleedCause || context.o3Value || "l'écart déclaré";
  return computeHonorairesRoiAnchoring(context.sliderValue, cause).script;
}

export function getCoachScriptForQuestion(
  context: SalesCoachContext,
  annualHonorairesMin?: number,
): string | null {
  if (!isCabinetBuyerSalesAudience(context.audience)) {
    return null;
  }

  switch (context.questionId) {
    case "o3":
      return buildO3Script(context);
    case "o4":
      return buildO4Script(context);
    case "o6":
      return buildO6Script(context);
    case "historique_intro":
      return buildHistoriqueEmpathyIntro(context);
    case "q21":
      return buildQ21Script(context);
    case "q13":
      return annualHonorairesMin !== undefined
        ? buildQ13Script(context, annualHonorairesMin)
        : null;
    default:
      return null;
  }
}

export function requiresO3FollowUp(o3Value: string | undefined): boolean {
  return o3Value === "insufficient_prospects";
}
