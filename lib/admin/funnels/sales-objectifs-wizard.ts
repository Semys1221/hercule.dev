import type { SalesSliderConfig } from "@/components/internal/funnels/sales/sales-questions";
import { formatSliderLabel } from "@/components/internal/funnels/sales/sales-questions";
import {
  B3_YEAR_MAP,
  B5_METHOD_OPTIONS,
  B8_GAP_OPTIONS,
  getB7Options,
  type B3YearId,
  type B5MethodId,
} from "@/lib/admin/funnels/sales-bleed-tunnel";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";

export type W1GoalType = "more_volume" | "better_quality";
export type W11MethodDurationId = "<1y" | "1-3y" | "3-5y" | "5y+";
export type W14TimelineId = "12m" | "24m" | "36m";
export type W15WaitId = "wait" | "shortcut";
export type W16UrgencyId = "strategic" | "resale" | "other";
export type W8TriedId = "none" | "looked" | "tried";
export type W18InactionId =
  | "major_gap"
  | "significant_gap"
  | "moderate_gap"
  | "near_target"
  | "at_capacity";
export type WizardChartMetricId = "metric" | "volume" | "clients";

export type WizardChartPoint = {
  t: string;
  statuQuo: number | null;
  goal: number | null;
};

export type WizardChartModel = {
  metricId: WizardChartMetricId;
  metricLabel: string;
  data: WizardChartPoint[];
  gapLabel: string;
  hint: string;
  showCurrent: boolean;
  showGoal: boolean;
  annotation?: string;
  inactionCaption?: string;
};

export const WIZARD_OBJECTIFS_SUBTITLE =
  "Qualification courte : où va le cabinet, où il en est, et ce qui bloque la méthode actuelle. On va droit au but.";

export const WIZARD_QUESTION_IDS = [
  "w1",
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w8",
  "w8Tried",
  "w8TriedWho",
  "w8Criteria",
  "w8Brake",
  "w9",
  "w10",
  "w11",
  "w12",
  "w13",
  "w13Why",
  "w14",
  "w15",
  "w16",
  "w16Detail",
  "w18",
  "w17",
  "diagnostic_card",
] as const;

export type WizardObjectifsQuestionId = (typeof WIZARD_QUESTION_IDS)[number];

const countFormatter = new Intl.NumberFormat("fr-FR");

export const W11_METHOD_DURATION_OPTIONS: ReadonlyArray<{ id: W11MethodDurationId; label: string }> =
  [
    { id: "<1y", label: "Moins d'un an" },
    { id: "1-3y", label: "1 à 3 ans" },
    { id: "3-5y", label: "3 à 5 ans" },
    { id: "5y+", label: "Plus de 5 ans" },
  ];

export const W14_TIMELINE_OPTIONS: ReadonlyArray<{ id: W14TimelineId; label: string }> = [
  { id: "12m", label: "12 mois" },
  { id: "24m", label: "24 mois" },
  { id: "36m", label: "36 mois" },
];

export const W15_WAIT_OPTIONS: ReadonlyArray<{ id: W15WaitId; label: string }> = [
  { id: "wait", label: "Oui, je peux attendre" },
  {
    id: "shortcut",
    label: "Je suis justement sur cet appel pour trouver un shortcut",
  },
];

export const W16_URGENCY_OPTIONS: ReadonlyArray<{ id: W16UrgencyId; label: string }> = [
  { id: "strategic", label: "Objectif stratégique (croissance, recrutement, associé)" },
  { id: "resale", label: "Projet de revente / valorisation du cabinet" },
  { id: "other", label: "Autre urgence" },
];

export const W8_TRIED_OPTIONS: ReadonlyArray<{ id: W8TriedId; label: string }> = [
  { id: "none", label: "Non, pas encore exploré" },
  { id: "looked", label: "Oui, j'ai regardé d'autres options" },
  { id: "tried", label: "Oui, j'ai essayé / testé d'autres solutions" },
];

export const W8_CRITERIA_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "predictable_flow", label: "Flux prévisible sur 6 mois" },
  { id: "zone_typology", label: "Demandes dans la zone / typologie" },
  { id: "owned_asset", label: "Actif propriétaire (pas de location d'attention)" },
  { id: "honoraires_fit", label: "Compatible honoraires / ticket" },
  { id: "no_single_channel", label: "Pas de dépendance à un seul canal" },
  { id: "other", label: "Autre" },
];

export const W9_TRAP_TEMPLATE =
  "Le cabinet vise **{goal6m}** (actuellement **{currentSnapshot}**). Le levier principal déclaré est **{method}**.\n**Pourquoi {method} n'a pas permis d'atteindre {goal6m} ?**";

export const W17_SYNTHESIS_TEMPLATE =
  "Donc vous recherchez une solution qui, en **6 mois**, permet d'atteindre **{goal6m}** car :\n- **{reason1}**\n- **{reason2}**\n- **{reason3}**\n\n**{method}** est bridé par **{brake}**. Si rien change : **{inaction}**.\n\nConfirmez-vous ?";

export const WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE =
  "Aujourd'hui : objectif **{goal6m}** · **{method}** bridé par **{brake}** · **{inaction}**. Passez à l'étape suivante pour construire votre système Hercule sur mesure.";

export function usesObjectifsWizard(values: SalesQualificationValues): boolean {
  return Boolean(values.w1);
}

export function getWizardVolumeUnit(audience: Audience): string {
  return isCifSalesAudience(audience) ? "mandats" : "dossiers";
}

export function getWizardMetricLabel(audience: Audience): string {
  return isCifSalesAudience(audience) ? "encours" : "CA annuel";
}

export function resolveW8MethodLabel(values: SalesQualificationValues): string {
  if (!values.w8) {
    return "";
  }
  return B5_METHOD_OPTIONS.find((option) => option.id === values.w8)?.label ?? "";
}

export function resolveW10Year(values: SalesQualificationValues): number | undefined {
  if (values.w10Year) {
    return values.w10Year;
  }
  if (values.w10 && values.w10 in B3_YEAR_MAP) {
    return B3_YEAR_MAP[values.w10 as B3YearId];
  }
  return undefined;
}

export function resolveW16Label(values: SalesQualificationValues): string {
  return W16_URGENCY_OPTIONS.find((option) => option.id === values.w16)?.label ?? "";
}

export function resolveW14Label(values: SalesQualificationValues): string {
  return W14_TIMELINE_OPTIONS.find((option) => option.id === values.w14)?.label ?? "";
}

export function resolveW8BrakeLabel(values: SalesQualificationValues): string {
  if (!values.w8Brake || !values.w8) {
    return "";
  }
  return getB7Options(values.w8).find((option) => option.id === values.w8Brake)?.label ?? "";
}

export function resolveW18Label(values: SalesQualificationValues): string {
  return B8_GAP_OPTIONS.find((option) => option.id === values.w18)?.label ?? "";
}

export function resolveW8CriteriaLabels(values: SalesQualificationValues): string {
  const selected = values.w8Criteria ?? [];
  return W8_CRITERIA_OPTIONS
    .filter((option) => selected.includes(option.id))
    .map((option) => option.label)
    .join(" · ");
}

export function getW8BrakeOptions(
  values: SalesQualificationValues,
): ReadonlyArray<{ id: string; label: string }> {
  if (!values.w8) {
    return [];
  }
  return getB7Options(values.w8);
}

export function getDefaultWizardChartMetric(values: SalesQualificationValues): WizardChartMetricId {
  return values.w1 === "more_volume" ? "volume" : "metric";
}

export function getWizardChartMetricForQuestion(
  questionId: string,
): WizardChartMetricId | null {
  switch (questionId) {
    case "w2":
    case "w7":
      return "clients";
    case "w3":
    case "w5":
      return "metric";
    case "w4":
    case "w6":
      return "volume";
    default:
      return null;
  }
}

export type ImmersiveChartPresence = "off" | "peek" | "moment" | "hero";

export function getImmersiveChartPresence(stepId: string): ImmersiveChartPresence {
  switch (stepId) {
    case "w2":
    case "w3":
    case "w4":
      return "peek";
    case "w5":
    case "w6":
    case "w7":
      return "moment";
    case "w17":
    case "w18":
    case "diagnostic_card":
      return "hero";
    case "p0":
      return "peek";
    default:
      return "off";
  }
}

const WIZARD_SLIDER_QUESTION_IDS = new Set(["w2", "w3", "w4", "w5", "w6", "w7"]);

export function getWizardSliderConfig(
  questionId: string,
  audience: Audience,
): SalesSliderConfig {
  const isCif = isCifSalesAudience(audience);

  switch (questionId) {
    case "w2":
    case "w7":
      return { min: 0, max: 500, step: 1, unit: "count", defaultValue: 50 };
    case "w4":
    case "w6":
      return { min: 0, max: 20, step: 1, unit: "count", defaultValue: 2 };
    case "w3":
    case "w5":
      if (isCif) {
        return {
          min: 1_000_000,
          max: 500_000_000,
          step: 1_000_000,
          unit: "eur",
          defaultValue: 10_000_000,
        };
      }
      return {
        min: 50_000,
        max: 5_000_000,
        step: 10_000,
        unit: "eur",
        defaultValue: 300_000,
      };
    default:
      return { min: 0, max: 20, step: 1, unit: "count", defaultValue: 0 };
  }
}

function formatMetricValue(value: number | undefined, audience: Audience): string {
  if (typeof value !== "number") {
    return "—";
  }
  return formatSliderLabel(value, "eur");
}

function formatCountClients(value: number | undefined): string {
  if (typeof value !== "number") {
    return "—";
  }
  return `${countFormatter.format(value)} clients`;
}

function formatVolumePerMonth(value: number | undefined, audience: Audience): string {
  if (typeof value !== "number") {
    return "—";
  }
  const unit = getWizardVolumeUnit(audience);
  return `${value} ${unit} / mois`;
}

export function formatCurrentSnapshot(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  const parts = [
    formatCountClients(values.w2),
    `${getWizardMetricLabel(audience)} ${formatMetricValue(values.w3, audience)}`,
    formatVolumePerMonth(values.w4, audience),
  ];
  return parts.join(" · ");
}

export function formatGoal6m(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  const parts = [
    `${getWizardMetricLabel(audience)} ${formatMetricValue(values.w5, audience)}`,
    formatVolumePerMonth(values.w6, audience),
    formatCountClients(values.w7),
  ];
  return parts.join(" · ");
}

export function formatGoalSummary(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  return formatGoal6m(values, audience);
}

export function formatGoalGap(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  const volumeGap =
    typeof values.w6 === "number" && typeof values.w4 === "number"
      ? values.w6 - values.w4
      : 0;
  const clientGap =
    typeof values.w7 === "number" && typeof values.w2 === "number"
      ? values.w7 - values.w2
      : 0;
  const unit = getWizardVolumeUnit(audience);

  if (volumeGap > 0 || clientGap > 0) {
    const parts: string[] = [];
    if (volumeGap > 0) {
      parts.push(`+${volumeGap} ${unit} / mois`);
    }
    if (clientGap > 0) {
      parts.push(`+${clientGap} clients`);
    }
    return parts.join(" · ");
  }

  return "Écart à combler sur 6 mois";
}

function buildReason1(values: SalesQualificationValues, audience: Audience): string {
  const volumeGap =
    typeof values.w6 === "number" && typeof values.w4 === "number"
      ? values.w6 - values.w4
      : 0;
  const unit = getWizardVolumeUnit(audience);
  if (volumeGap > 0) {
    return `Il manque ${volumeGap} ${unit} / mois pour atteindre la cible`;
  }
  return `La cible volume (${formatVolumePerMonth(values.w6, audience)}) n'est pas couverte par le flux actuel`;
}

function buildReason2(values: SalesQualificationValues): string {
  const clientGap =
    typeof values.w7 === "number" && typeof values.w2 === "number"
      ? values.w7 - values.w2
      : 0;
  if (clientGap > 0) {
    return `Il manque ${clientGap} clients pour la cible à 6 mois`;
  }
  return `Le portefeuille clients doit passer de ${values.w2 ?? "—"} à ${values.w7 ?? "—"}`;
}

function buildReason3(values: SalesQualificationValues): string {
  const brake = resolveW8BrakeLabel(values);
  if (brake) {
    return `${resolveW8MethodLabel(values)} : ${brake}`;
  }
  const method = resolveW8MethodLabel(values);
  if (values.w16) {
    return `${method} ne couvre pas l'urgence : ${resolveW16Label(values)}`;
  }
  if (values.w13 === "no" && values.w13Why?.trim()) {
    return values.w13Why.trim();
  }
  return `${method} n'a pas permis d'atteindre la cible sur la période déclarée`;
}

export function resolveUrgencyLabel(values: SalesQualificationValues): string {
  if (values.w16) {
    return resolveW16Label(values);
  }
  if (values.w14) {
    return `délai ${resolveW14Label(values)}`;
  }
  if (values.w15 === "shortcut") {
    return "shortcut recherché";
  }
  return "—";
}

export function formatObjectifsWizardInterpolation(
  template: string,
  values: SalesQualificationValues,
  audience: Audience,
): string {
  const replacements: Record<string, string> = {
    method: resolveW8MethodLabel(values),
    goal6m: formatGoal6m(values, audience),
    goalSummary: formatGoalSummary(values, audience),
    currentSnapshot: formatCurrentSnapshot(values, audience),
    year: resolveW10Year(values) ? String(resolveW10Year(values)) : "—",
    volumeUnit: getWizardVolumeUnit(audience),
    metricLabel: getWizardMetricLabel(audience),
    urgencyLabel: resolveUrgencyLabel(values),
    reason1: buildReason1(values, audience),
    reason2: buildReason2(values),
    reason3: buildReason3(values),
    gap: formatGoalGap(values, audience),
    brake: resolveW8BrakeLabel(values),
    inaction: resolveW18Label(values),
    criteria: resolveW8CriteriaLabels(values),
  };

  return template.replace(/\{(\w+)\}/g, (match, token: string) => replacements[token] ?? match);
}

export function isWizardStepVisible(
  questionId: string,
  values: SalesQualificationValues,
): boolean {
  if (questionId === "w13Why") {
    return Boolean(values.w13);
  }

  if (questionId === "w8TriedWho") {
    return Boolean(values.w8Tried && values.w8Tried !== "none");
  }

  if (questionId === "w16") {
    return values.w15 === "shortcut" || (values.w14 !== undefined && values.w14 !== "12m");
  }

  if (questionId === "w16Detail") {
    return values.w16 === "other";
  }

  if (questionId === "diagnostic_card") {
    return values.w17Acknowledged === true;
  }

  return true;
}

export function getVisibleWizardQuestionIds(
  values: SalesQualificationValues,
): WizardObjectifsQuestionId[] {
  return WIZARD_QUESTION_IDS.filter((id) => isWizardStepVisible(id, values));
}

export function getWizardFormFieldName(
  questionId: string,
): keyof SalesQualificationValues | null {
  switch (questionId) {
    case "w9":
      return "w9Acknowledged";
    case "w12":
      return "w12Confirmed";
    case "w17":
      return "w17Acknowledged";
    case "diagnostic_card":
      return "bleedDiagnosticAccepted";
    default:
      if (
        questionId === "w1" ||
        questionId === "w2" ||
        questionId === "w3" ||
        questionId === "w4" ||
        questionId === "w5" ||
        questionId === "w6" ||
        questionId === "w7" ||
        questionId === "w8" ||
        questionId === "w8Tried" ||
        questionId === "w8TriedWho" ||
        questionId === "w8Criteria" ||
        questionId === "w8Brake" ||
        questionId === "w18" ||
        questionId === "w10" ||
        questionId === "w11" ||
        questionId === "w13" ||
        questionId === "w13Why" ||
        questionId === "w14" ||
        questionId === "w15" ||
        questionId === "w16" ||
        questionId === "w16Detail"
      ) {
        return questionId as keyof SalesQualificationValues;
      }
      return null;
  }
}

export function getW4Prompt(_values: SalesQualificationValues, audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Quel est le nombre de transformations qui vous conviennent par mois ?"
    : "Quel est le nombre de dossiers qui vous conviennent par mois ?";
}

export function getW6Prompt(audience: Audience): string {
  const unit = isCifSalesAudience(audience) ? "transformations" : "dossiers";
  return `Vous souhaiteriez effectuer combien de ${unit} qui vous conviennent par mois ?`;
}

export function getW7Prompt(): string {
  return "Vous souhaiteriez être à combien de clients dans 6 mois ?";
}

export function getW3Prompt(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Quelle est l'encours ?"
    : "Quel est le chiffre d'affaires annuel ?";
}

export function getW5Prompt(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Vous souhaiteriez dans 6 mois être à quelle encours ?"
    : "Vous souhaiteriez dans 6 mois être à quel chiffre d'affaires annuel ?";
}

export type WizardFieldCompleteOptions = {
  touchedSliderFields?: ReadonlySet<string>;
};

export function isWizardFieldComplete(
  questionId: string,
  values: SalesQualificationValues,
  options?: WizardFieldCompleteOptions,
): boolean {
  switch (questionId) {
    case "w9":
      return values.w9Acknowledged === true;
    case "w12":
      return values.w12Confirmed === true;
    case "w17":
      return values.w17Acknowledged === true;
    case "diagnostic_card":
      return values.bleedDiagnosticAccepted === true;
    case "w13Why":
      if (values.w13 === "no") {
        return Boolean(values.w13Why?.trim() && values.w13Why.trim().length >= 10);
      }
      return values.w13 === "yes";
    case "w16":
      return typeof values.w16 === "string" && values.w16.length > 0;
    case "w16Detail":
      return Boolean(values.w16Detail?.trim());
    case "w8Criteria":
      return (values.w8Criteria?.length ?? 0) >= 1 && (values.w8Criteria?.length ?? 0) <= 3;
    case "w8TriedWho":
      if (values.w8Tried === "none" || !values.w8Tried) {
        return true;
      }
      return Boolean(values.w8TriedWho?.trim() && values.w8TriedWho.trim().length >= 3);
    default: {
      if (
        options?.touchedSliderFields &&
        WIZARD_SLIDER_QUESTION_IDS.has(questionId) &&
        !options.touchedSliderFields.has(questionId)
      ) {
        return false;
      }
      const field = getWizardFormFieldName(questionId);
      if (!field || field === "bleedDiagnosticAccepted") {
        return false;
      }
      const value = values[field];
      if (typeof value === "boolean") {
        return value === true;
      }
      if (typeof value === "number") {
        return true;
      }
      if (typeof value === "string") {
        return value.length > 0;
      }
      return false;
    }
  }
}

export function buildWizardChartModel(
  values: SalesQualificationValues,
  audience: Audience,
  metricId: WizardChartMetricId = getDefaultWizardChartMetric(values),
): WizardChartModel {
  const isCif = isCifSalesAudience(audience);
  const volumeLabel = isCif ? "Volume (mandats / mois)" : "Volume (dossiers / mois)";
  const metricLabel =
    metricId === "clients"
      ? "Clients"
      : metricId === "volume"
        ? volumeLabel
        : getWizardMetricLabel(audience);

  const pair =
    metricId === "clients"
      ? { current: values.w2, goal: values.w7 }
      : metricId === "volume"
        ? { current: values.w4, goal: values.w6 }
        : { current: values.w3, goal: values.w5 };

  const showCurrent = typeof pair.current === "number";
  const showGoal = typeof pair.goal === "number";
  const currentValue = showCurrent ? pair.current! : null;
  const goalValue = showGoal ? pair.goal! : null;
  const goal12mValue =
    showCurrent && showGoal && currentValue !== null && goalValue !== null
      ? currentValue + 2 * (goalValue - currentValue)
      : null;

  const data: WizardChartPoint[] = [
    {
      t: "Aujourd'hui",
      statuQuo: currentValue,
      goal: currentValue,
    },
    {
      t: "Dans 6 mois",
      statuQuo: currentValue,
      goal: goalValue ?? currentValue,
    },
    {
      t: "Dans 12 mois",
      statuQuo: currentValue,
      goal: goal12mValue ?? goalValue ?? currentValue,
    },
  ];

  let hint = "Les chiffres vont tracer l'écart entre aujourd'hui et la cible à 6 mois.";
  if (showCurrent && !showGoal) {
    hint = "Renseignez la cible à 6 mois pour voir l'écart se dessiner.";
  } else if (showCurrent && showGoal) {
    hint =
      "L'écart entre les deux courbes = ce que la méthode actuelle ne comble pas. La projection 12 mois prolonge la trajectoire vers la cible à 6 mois.";
  }

  let annotation: string | undefined;
  if (values.w8 && values.w8Brake) {
    annotation = `${resolveW8MethodLabel(values)} bridé : ${resolveW8BrakeLabel(values)}`;
  }

  const inactionCaption = values.w18 ? resolveW18Label(values) : undefined;

  return {
    metricId,
    metricLabel,
    data,
    gapLabel: formatGoalGap(values, audience),
    hint,
    showCurrent,
    showGoal,
    annotation,
    inactionCaption,
  };
}

export type { B5MethodId };
