import {
  getSalesQuestionById,
  type SalesQuestion,
} from "@/components/internal/funnels/sales/sales-questions";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import {
  formatCabinetSliderValue,
  resolveB3Year,
  resolveB7Label,
  resolveB8Label,
  resolveMethodLabel,
  resolvePrimaryMethodId,
} from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  formatCurrentSnapshot,
  formatGoal6m,
  formatGoalGap,
  resolveUrgencyLabel,
  resolveW8BrakeLabel,
  resolveW13WhyLabel,
  resolveW16Label,
  resolveW16OtherLabel,
  resolveW16ResaleSubLabel,
  resolveW16StrategicSubLabel,
  resolveW8MethodLabel,
  resolveW10Year,
  resolveW18Label,
  usesObjectifsWizard,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import {
  isCabinetBuyerSalesAudience,
  isCifSalesAudience,
  isComptableSalesAudience,
} from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";

export type O3DurationId = "<3m" | "6m" | "12m" | "24m+";

export const O3_DURATION_OPTIONS: ReadonlyArray<{ id: O3DurationId; label: string }> = [
  { id: "<3m", label: "< 3 mois" },
  { id: "6m", label: "6 mois" },
  { id: "12m", label: "12 mois" },
  { id: "24m+", label: "24 mois+" },
];

export type BleedTrack = {
  businessNoun: string;
  cause: string;
  causeId: string;
  primaryBrake: string;
  gap: string;
  gapId: string;
  duration: string;
  synthesis: string[];
  honorairesAnnual?: number;
  reservedCapacity?: number;
  goal?: string;
  current?: string;
  openingYear?: string;
  primaryMethod?: string;
  methodBrake?: string;
  goalType?: string;
};

function getBusinessNoun(audience: Audience): string {
  if (isComptableSalesAudience(audience) || isCifSalesAudience(audience)) {
    return "cabinet";
  }
  if (audience === "entreprise") {
    return "activité";
  }
  return "agence";
}

function getBusinessPhrase(businessNoun: string): string {
  if (businessNoun === "agence") {
    return "l'agence";
  }
  if (businessNoun === "activité") {
    return "l'activité";
  }
  return "le cabinet";
}

function resolveOptionLabel(
  question: SalesQuestion | undefined,
  optionId: string,
): string {
  if (!question || !optionId) {
    return "";
  }
  if (question.type !== "single" && question.type !== "multi") {
    return "";
  }
  return question.options.find((option) => option.id === optionId)?.label ?? "";
}

function resolveMultiLabels(
  question: SalesQuestion | undefined,
  optionIds: string[],
): string[] {
  return optionIds
    .map((id) => resolveOptionLabel(question, id))
    .filter((label) => label.length > 0);
}

function resolveDurationLabel(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  if (values.o3Duration) {
    const match = O3_DURATION_OPTIONS.find((option) => option.id === values.o3Duration);
    if (match) {
      return match.label;
    }
  }

  if (isCabinetBuyerSalesAudience(audience)) {
    return values.o3FollowUp?.trim() ?? "";
  }

  return "";
}

function buildCabinetBleedTrack(
  values: SalesQualificationValues,
  audience: Audience,
): BleedTrack {
  const cabinetAudience = isCifSalesAudience(audience) ? "cif" : "comptable";

  if (usesObjectifsWizard(values)) {
    const methodLabel = resolveW8MethodLabel(values);
    const methodBrake =
      resolveW8BrakeLabel(values, audience) ||
      resolveW13WhyLabel(values) ||
      (values.w16 === "strategic"
        ? resolveW16StrategicSubLabel(values)
        : values.w16 === "resale"
          ? resolveW16ResaleSubLabel(values)
          : values.w16 === "other"
            ? resolveW16OtherLabel(values)
            : resolveW16Label(values)) ||
      resolveUrgencyLabel(values);
    const inactionLabel = resolveW18Label(values);
    const numericGap = formatGoalGap(values, audience);
    const openingYear = resolveW10Year(values);

    const bleed: BleedTrack = {
      businessNoun: "cabinet",
      goal: formatGoal6m(values, audience),
      current: formatCurrentSnapshot(values, audience),
      openingYear: openingYear ? String(openingYear) : "",
      primaryMethod: methodLabel,
      methodBrake,
      goalType: values.w1 ?? "",
      cause: methodBrake,
      causeId:
        values.w16StrategicSub ??
        values.w16ResaleSub ??
        values.w16 ??
        values.w13 ??
        "",
      primaryBrake: methodBrake,
      gap: inactionLabel ? `${numericGap} · ${inactionLabel}` : numericGap,
      gapId: values.w18 ?? values.w14 ?? "",
      duration: openingYear ? String(openingYear) : "",
      synthesis: methodLabel ? [methodLabel] : [],
    };

    if (typeof values.w19 === "number") {
      bleed.honorairesAnnual = values.w19;
    } else if (typeof values.q13 === "number") {
      bleed.honorairesAnnual = values.q13;
    }
    if (typeof values.q20 === "number") {
      bleed.reservedCapacity = values.q20;
    }

    return bleed;
  }

  const methodBrake = resolveB7Label(values);
  const methodId = resolvePrimaryMethodId(values);
  const openingYear = resolveB3Year(values);

  const bleed: BleedTrack = {
    businessNoun: "cabinet",
    goal: formatCabinetSliderValue(values.b4, values.b1, cabinetAudience),
    current: formatCabinetSliderValue(values.b2, values.b1, cabinetAudience),
    openingYear: openingYear ? String(openingYear) : "",
    primaryMethod: resolveMethodLabel(values),
    methodBrake,
    goalType: values.b1 ?? "",
    cause: methodBrake,
    causeId: values.b7 ?? "",
    primaryBrake: methodBrake,
    gap: resolveB8Label(values),
    gapId: values.b8 ?? "",
    duration: openingYear ? String(openingYear) : "",
    synthesis: methodId ? [resolveMethodLabel(values)] : [],
  };

  if (typeof values.q13 === "number") {
    bleed.honorairesAnnual = values.q13;
  }
  if (typeof values.q20 === "number") {
    bleed.reservedCapacity = values.q20;
  }

  return bleed;
}

function usesCabinetBleedTunnel(values: SalesQualificationValues): boolean {
  return usesObjectifsWizard(values) || Boolean(values.b1 && typeof values.b2 === "number");
}

export function buildBleedTrack(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): BleedTrack {
  if (isCabinetBuyerSalesAudience(audience) && usesCabinetBleedTunnel(values)) {
    return buildCabinetBleedTrack(values, audience);
  }

  const o3Question = getSalesQuestionById("o3", audience);
  const o4Question = getSalesQuestionById("o4", audience);
  const o6Question = getSalesQuestionById("o6", audience);
  const o1Question = getSalesQuestionById("o1", audience);

  const causeId = values.o3;
  const gapId = values.o6;
  const primaryBrakeId = values.o4[0] ?? "";

  const bleed: BleedTrack = {
    businessNoun: getBusinessNoun(audience),
    cause: resolveOptionLabel(o3Question, causeId),
    causeId,
    primaryBrake: resolveOptionLabel(o4Question, primaryBrakeId),
    gap: resolveOptionLabel(o6Question, gapId),
    gapId,
    duration: resolveDurationLabel(values, audience),
    synthesis: resolveMultiLabels(o1Question, values.o1),
  };

  if (typeof values.q13 === "number" && isCabinetBuyerSalesAudience(audience)) {
    bleed.honorairesAnnual = values.q13;
  }

  if (typeof values.q20 === "number") {
    bleed.reservedCapacity = values.q20;
  }

  return bleed;
}

const BLEED_TOKEN_VALUES: Record<string, (bleed: BleedTrack) => string> = {
  cause: (bleed) => bleed.cause,
  gap: (bleed) => bleed.gap,
  business: (bleed) => getBusinessPhrase(bleed.businessNoun),
  duration: (bleed) => bleed.duration,
  primaryBrake: (bleed) => bleed.primaryBrake,
  causeId: (bleed) => bleed.causeId,
  gapId: (bleed) => bleed.gapId,
  goal: (bleed) => bleed.goal ?? "",
  current: (bleed) => bleed.current ?? "",
  year: (bleed) => bleed.openingYear ?? bleed.duration,
  method: (bleed) => bleed.primaryMethod ?? "",
};

export function interpolateBleed(template: string, bleed: BleedTrack): string {
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const resolver = BLEED_TOKEN_VALUES[token];
    return resolver ? resolver(bleed) : match;
  });
}

export function resolveBleedSectionSubtitle(
  sectionId: string,
  audience: Audience,
  values: SalesQualificationValues,
): string | undefined {
  const bleed = buildBleedTrack(values, audience);
  const isCabinet = isCabinetBuyerSalesAudience(audience);

  if (sectionId === "capacite") {
    if (isCabinet) {
      return interpolateBleed(
        "Dimensionner ce que le cabinet peut absorber quand Foundation capte la zone — pour l'écart {gap} déclaré.",
        bleed,
      );
    }
    return interpolateBleed(
      "Dimensionner la capacité du {business} pour combler l'écart {gap} déclaré.",
      bleed,
    );
  }

  if (sectionId === "conditions" && !isCabinet) {
    return interpolateBleed(
      "Priorités de collaboration et capacité réservée pour traiter {cause}.",
      bleed,
    );
  }

  return undefined;
}

export function formatBleedStickyChips(bleed: BleedTrack): string[] {
  const candidates = [
    bleed.goal ?? bleed.cause,
    bleed.primaryMethod ?? bleed.primaryBrake,
    bleed.gap || bleed.duration,
  ];
  const chips: string[] = [];

  for (const candidate of candidates) {
    if (!candidate || chips.includes(candidate)) {
      continue;
    }
    chips.push(candidate);
    if (chips.length >= 3) {
      break;
    }
  }

  return chips;
}
