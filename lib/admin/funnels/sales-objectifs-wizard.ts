import type { SalesSliderConfig } from "@/components/internal/funnels/sales/sales-questions";
import { formatSliderLabel } from "@/components/internal/funnels/sales/sales-questions";
import {
  B3_YEAR_MAP,
  B5_METHOD_OPTIONS,
  getB7Options,
  type B3YearId,
  type B5MethodId,
} from "@/lib/admin/funnels/sales-bleed-tunnel";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";

export type W1GoalType = "more_volume" | "better_quality";
export type W14TimelineId = "12m" | "24m" | "36m";
export type W15WaitId = "wait" | "shortcut";
export type W16UrgencyId = "strategic" | "resale" | "other";
export type W16StrategicSubId = "growth" | "recruitment" | "associate";
export type W16ResaleSubId = "valuation" | "succession" | "exit";
export type W16OtherId =
  | "cash_pressure"
  | "client_loss"
  | "team_departure"
  | "regulatory"
  | "commercial_window"
  | "reputation";
export type W18AcceptanceId = "acceptable" | "not_acceptable" | "mixed";
export type WExchangeWhyId = "certainty" | "not_real_goal";
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
  "Qualification : situation actuelle du cabinet, objectif à 6 mois et limites de la méthode d'acquisition en place.";

export const WIZARD_QUESTION_IDS = [
  "w1",
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w8",
  "w10",
  "w12",
  "w13",
  "wExchangeWhy13",
  "w13Why",
  "w14",
  "wExchangeWhy14",
  "w15",
  "wExchangeWhy15",
  "w16",
  "w16StrategicSub",
  "w16ResaleSub",
  "w16Detail",
  "w18",
  "wExchangeWhy18",
  "w17",
  "diagnostic_card",
] as const;

export type WizardObjectifsQuestionId = (typeof WIZARD_QUESTION_IDS)[number];

const WIZARD_MAPPING_TITLES: Record<WizardObjectifsQuestionId, string> = {
  w1: "Objectif principal",
  w2: "Clients actuels",
  w3: "Honoraires actuels",
  w4: "Volume mensuel actuel",
  w5: "Objectif à 6 mois (€)",
  w6: "Volume mensuel visé",
  w7: "Clients visés (6 mois)",
  w8: "Méthode d'acquisition",
  w10: "Année d'exercice",
  w12: "Confirmation objectif 6 mois",
  w13: "Méthode suffisante en 6 mois ?",
  wExchangeWhy13: "Motivation de l'échange",
  w13Why: "Pourquoi ?",
  w14: "Délai estimé ({method})",
  wExchangeWhy14: "Motivation de l'échange",
  w15: "Attendre ou accélérer ?",
  wExchangeWhy15: "Motivation de l'échange",
  w16: "Impératif court terme",
  w16StrategicSub: "Impératif stratégique",
  w16ResaleSub: "Impératif revente",
  w16Detail: "Détail impératif",
  w18: "Statu quo acceptable ?",
  wExchangeWhy18: "Motivation de l'échange",
  w17: "Synthèse",
  diagnostic_card: "Diagnostic mentionné",
};

const CIF_WIZARD_MAPPING_TITLE_OVERRIDES: Partial<
  Record<WizardObjectifsQuestionId, string>
> = {
  w3: "Encours actuel",
  w4: "Mandats par mois (actuel)",
  w5: "Encours visé (6 mois)",
  w6: "Mandats visés par mois",
};

export function getWizardMappingTitle(
  id: WizardObjectifsQuestionId,
  audience: Audience,
  fallbackPrompt?: string,
): string {
  if (isCifSalesAudience(audience)) {
    const cifTitle = CIF_WIZARD_MAPPING_TITLE_OVERRIDES[id];
    if (cifTitle) {
      return cifTitle;
    }
  }

  const title = WIZARD_MAPPING_TITLES[id];
  if (title) {
    return title;
  }

  return fallbackPrompt ?? id;
}

const EXCHANGE_WHY_STEP_IDS = new Set([
  "wExchangeWhy13",
  "wExchangeWhy14",
  "wExchangeWhy15",
  "wExchangeWhy18",
]);

const countFormatter = new Intl.NumberFormat("fr-FR");

export const W14_TIMELINE_OPTIONS: ReadonlyArray<{ id: W14TimelineId; label: string }> = [
  { id: "12m", label: "12 mois" },
  { id: "24m", label: "24 mois" },
  { id: "36m", label: "36 mois" },
];

export const W15_WAIT_OPTIONS: ReadonlyArray<{ id: W15WaitId; label: string }> = [
  { id: "wait", label: "Oui, le cabinet peut attendre" },
  {
    id: "shortcut",
    label: "Non — le cabinet est sur cet échange pour accélérer, pas pour attendre",
  },
];

export const W16_URGENCY_OPTIONS: ReadonlyArray<{ id: W16UrgencyId; label: string }> = [
  { id: "strategic", label: "Impératif stratégique (croissance, recrutement, associé)" },
  { id: "resale", label: "Projet de revente / valorisation du cabinet" },
  { id: "other", label: "Autre impératif" },
];

export const W16_STRATEGIC_SUB_OPTIONS: ReadonlyArray<{ id: W16StrategicSubId; label: string }> =
  [
    { id: "growth", label: "Croissance / développement commercial" },
    { id: "recruitment", label: "Recrutement / renfort d'équipe" },
    { id: "associate", label: "Projet associé / gouvernance" },
  ];

export const W16_RESALE_SUB_OPTIONS: ReadonlyArray<{ id: W16ResaleSubId; label: string }> = [
  { id: "valuation", label: "Valorisation à court terme" },
  { id: "succession", label: "Transmission / reprise" },
  { id: "exit", label: "Cession en cours ou imminente" },
];

export const W16_OTHER_OPTIONS: ReadonlyArray<{ id: W16OtherId; label: string }> = [
  { id: "cash_pressure", label: "Pression trésorerie / besoin de flux rapide" },
  { id: "client_loss", label: "Perte ou risque sur un client majeur" },
  { id: "team_departure", label: "Départ associé / renfort équipe urgent" },
  { id: "regulatory", label: "Échéance réglementaire ou fiscale" },
  { id: "commercial_window", label: "Fenêtre commerciale limitée (offre, marché)" },
  { id: "reputation", label: "Enjeu image / réputation du cabinet" },
];

export const W18_ACCEPTANCE_OPTIONS: ReadonlyArray<{ id: W18AcceptanceId; label: string }> = [
  { id: "acceptable", label: "C'est acceptable tel quel" },
  {
    id: "not_acceptable",
    label: "Non — toute la philosophie du cabinet, c'est de ne pas stagner",
  },
  { id: "mixed", label: "Difficile à trancher / dépend d'autres leviers" },
];

export const W_EXCHANGE_WHY_OPTIONS: ReadonlyArray<{ id: WExchangeWhyId; label: string }> = [
  { id: "certainty", label: "Le cabinet souhaite atteindre l'objectif avec certitude" },
  { id: "not_real_goal", label: "Il ne s'agit pas réellement de l'objectif du cabinet" },
];

export const W_EXCHANGE_WHY_PROMPT =
  "Pourquoi le cabinet souhaite-t-il faire cet échange dans ce cas ?";

export const W17_SYNTHESIS_TEMPLATE =
  "Donc le cabinet recherche une solution qui, en **6 mois**, permet d'atteindre **{goal6m}** car :\n- **{reason1}**\n- **{reason2}**\n- **{reason3}**\n\n**{method}** ne suffit pas seule dans ce délai. Si rien change : **{inaction}**.\n\nLe cabinet confirme-t-il ?";

export const WIZARD_DIAGNOSTIC_MIRROR_TEMPLATE =
  "Aujourd'hui : objectif **{goal6m}** · **{method}** insuffisante seule · **{inaction}**. Passez à l'étape suivante pour construire le système Hercule sur mesure du cabinet.";

export function usesObjectifsWizard(values: SalesQualificationValues): boolean {
  return Boolean(values.w1);
}

export function getWizardVolumeUnit(audience: Audience): string {
  return isCifSalesAudience(audience) ? "mandats" : "dossiers";
}

export function getWizardMetricLabel(audience: Audience): string {
  return isCifSalesAudience(audience) ? "encours" : "honoraires annuels";
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

export function resolveW16StrategicSubLabel(values: SalesQualificationValues): string {
  return (
    W16_STRATEGIC_SUB_OPTIONS.find((option) => option.id === values.w16StrategicSub)?.label ?? ""
  );
}

export function resolveW16ResaleSubLabel(values: SalesQualificationValues): string {
  return W16_RESALE_SUB_OPTIONS.find((option) => option.id === values.w16ResaleSub)?.label ?? "";
}

export function resolveW16OtherLabel(values: SalesQualificationValues): string {
  return W16_OTHER_OPTIONS.find((option) => option.id === values.w16Detail)?.label ?? "";
}

export function resolveW13WhyLabel(values: SalesQualificationValues): string {
  if (!values.w13Why || !values.w8) {
    return "";
  }
  return getB7Options(values.w8).find((option) => option.id === values.w13Why)?.label ?? "";
}

export function isValidW13WhySelection(values: SalesQualificationValues): boolean {
  if (!values.w13Why || !values.w8) {
    return false;
  }
  return getB7Options(values.w8).some((option) => option.id === values.w13Why);
}

export function isValidW16DetailSelection(values: SalesQualificationValues): boolean {
  if (!values.w16Detail) {
    return false;
  }
  return W16_OTHER_OPTIONS.some((option) => option.id === values.w16Detail);
}

export function resolveW14Label(values: SalesQualificationValues): string {
  return W14_TIMELINE_OPTIONS.find((option) => option.id === values.w14)?.label ?? "";
}

export function resolveW18Label(values: SalesQualificationValues): string {
  return W18_ACCEPTANCE_OPTIONS.find((option) => option.id === values.w18)?.label ?? "";
}

export function resolveWExchangeWhyLabel(values: SalesQualificationValues): string {
  const answer =
    values.wExchangeWhy18 ??
    values.wExchangeWhy15 ??
    values.wExchangeWhy14 ??
    values.wExchangeWhy13;
  return W_EXCHANGE_WHY_OPTIONS.find((option) => option.id === answer)?.label ?? "";
}

export function hasWizardExchangeWhyRedirect(values: SalesQualificationValues): boolean {
  return (
    values.wExchangeWhy13 === "not_real_goal" ||
    values.wExchangeWhy14 === "not_real_goal" ||
    values.wExchangeWhy15 === "not_real_goal" ||
    values.wExchangeWhy18 === "not_real_goal"
  );
}

function getExchangeWhyField(
  questionId: string,
): keyof SalesQualificationValues | null {
  switch (questionId) {
    case "wExchangeWhy13":
      return "wExchangeWhy13";
    case "wExchangeWhy14":
      return "wExchangeWhy14";
    case "wExchangeWhy15":
      return "wExchangeWhy15";
    case "wExchangeWhy18":
      return "wExchangeWhy18";
    default:
      return null;
  }
}

export function needsExchangeWhyAfter13(values: SalesQualificationValues): boolean {
  return values.w13 === "yes" && !values.wExchangeWhy13;
}

export function needsExchangeWhyAfter14(values: SalesQualificationValues): boolean {
  return (
    values.w13 === "yes" &&
    values.w14 !== undefined &&
    values.w14 !== "12m" &&
    !values.wExchangeWhy14
  );
}

export function needsExchangeWhyAfter15(values: SalesQualificationValues): boolean {
  if (values.wExchangeWhy15) {
    return false;
  }
  if (values.w15 === "wait" && values.w14 === "12m") {
    return true;
  }
  return values.w13 === "yes" && values.w15 === "shortcut";
}

export function needsExchangeWhyAfter18(values: SalesQualificationValues): boolean {
  return values.w18 === "acceptable" && !values.wExchangeWhy18;
}

export function isWizardUrgencyStepVisible(values: SalesQualificationValues): boolean {
  return values.w15 === "shortcut" || (values.w14 !== undefined && values.w14 !== "12m");
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
    case "w1":
      return "peek";
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
  const method = resolveW8MethodLabel(values);
  if (values.w16 === "strategic" && values.w16StrategicSub) {
    return `${method} ne couvre pas l'urgence : ${resolveW16StrategicSubLabel(values)}`;
  }
  if (values.w16 === "resale" && values.w16ResaleSub) {
    return `${method} ne couvre pas l'urgence : ${resolveW16ResaleSubLabel(values)}`;
  }
  if (values.w16 === "other" && values.w16Detail) {
    return `${method} ne couvre pas l'urgence : ${resolveW16OtherLabel(values)}`;
  }
  if (values.w16) {
    return `${method} ne couvre pas l'urgence : ${resolveW16Label(values)}`;
  }
  if (values.w13 === "no" && values.w13Why) {
    const w13WhyLabel = resolveW13WhyLabel(values);
    if (w13WhyLabel) {
      return w13WhyLabel;
    }
  }
  if (values.wExchangeWhy13 === "certainty" || values.wExchangeWhy15 === "certainty") {
    return "Recherche de certitude sur l'objectif à 6 mois";
  }
  return `${method} n'a pas permis d'atteindre la cible sur la période déclarée`;
}

export function resolveUrgencyLabel(values: SalesQualificationValues): string {
  if (values.w16 === "strategic" && values.w16StrategicSub) {
    return resolveW16StrategicSubLabel(values);
  }
  if (values.w16 === "resale" && values.w16ResaleSub) {
    return resolveW16ResaleSubLabel(values);
  }
  if (values.w16 === "other" && values.w16Detail) {
    return resolveW16OtherLabel(values);
  }
  if (values.w16) {
    return resolveW16Label(values);
  }
  if (values.w14) {
    return `délai ${resolveW14Label(values)}`;
  }
  if (values.w15 === "shortcut") {
    return "accélération recherchée";
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
    inaction: resolveW18Label(values),
    exchangeWhy: resolveWExchangeWhyLabel(values),
  };

  return template.replace(/\{(\w+)\}/g, (match, token: string) => replacements[token] ?? match);
}

export function isWizardStepVisible(
  questionId: string,
  values: SalesQualificationValues,
): boolean {
  if (questionId === "w13Why") {
    return values.w13 === "no";
  }

  if (questionId === "wExchangeWhy13") {
    return needsExchangeWhyAfter13(values);
  }

  if (questionId === "wExchangeWhy14") {
    return needsExchangeWhyAfter14(values);
  }

  if (questionId === "wExchangeWhy15") {
    return needsExchangeWhyAfter15(values);
  }

  if (questionId === "wExchangeWhy18") {
    return needsExchangeWhyAfter18(values);
  }

  if (questionId === "w16") {
    return isWizardUrgencyStepVisible(values);
  }

  if (questionId === "w16StrategicSub") {
    return values.w16 === "strategic";
  }

  if (questionId === "w16ResaleSub") {
    return values.w16 === "resale";
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

export function getWizardRedirectStepId(
  values: SalesQualificationValues,
): WizardObjectifsQuestionId | null {
  if (hasWizardExchangeWhyRedirect(values)) {
    return "w1";
  }
  return null;
}

export function getWizardFormFieldName(
  questionId: string,
): keyof SalesQualificationValues | null {
  switch (questionId) {
    case "w12":
      return "w12Confirmed";
    case "w17":
      return "w17Acknowledged";
    case "diagnostic_card":
      return "bleedDiagnosticAccepted";
    default: {
      const exchangeField = getExchangeWhyField(questionId);
      if (exchangeField) {
        return exchangeField;
      }
      if (
        questionId === "w1" ||
        questionId === "w2" ||
        questionId === "w3" ||
        questionId === "w4" ||
        questionId === "w5" ||
        questionId === "w6" ||
        questionId === "w7" ||
        questionId === "w8" ||
        questionId === "w18" ||
        questionId === "w10" ||
        questionId === "w13" ||
        questionId === "w13Why" ||
        questionId === "w14" ||
        questionId === "w15" ||
        questionId === "w16" ||
        questionId === "w16StrategicSub" ||
        questionId === "w16ResaleSub" ||
        questionId === "w16Detail"
      ) {
        return questionId as keyof SalesQualificationValues;
      }
      return null;
    }
  }
}

export function getW4Prompt(_values: SalesQualificationValues, audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Combien de transformations le cabinet traite-t-il par mois ?"
    : "Combien de dossiers le cabinet traite-t-il par mois ?";
}

export function getW6Prompt(audience: Audience): string {
  const unit = isCifSalesAudience(audience) ? "transformations" : "dossiers";
  return `Combien de ${unit} le cabinet souhaite-t-il traiter par mois ?`;
}

export function getW7Prompt(): string {
  return "Combien de clients le cabinet vise-t-il dans 6 mois ?";
}

export function getW3Prompt(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Quel est l'encours du cabinet ?"
    : "Quels sont les honoraires annuels du cabinet ?";
}

export function getW5Prompt(audience: Audience): string {
  return isCifSalesAudience(audience)
    ? "Quel encours le cabinet vise-t-il dans 6 mois ?"
    : "Quels honoraires annuels le cabinet vise-t-il dans 6 mois ?";
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
    case "w12":
      return values.w12Confirmed === true;
    case "w17":
      return values.w17Acknowledged === true;
    case "diagnostic_card":
      return values.bleedDiagnosticAccepted === true;
    case "w13Why":
      return isValidW13WhySelection(values);
    case "w16":
      return typeof values.w16 === "string" && values.w16.length > 0;
    case "w16StrategicSub":
      return Boolean(values.w16StrategicSub);
    case "w16ResaleSub":
      return Boolean(values.w16ResaleSub);
    case "w16Detail":
      return isValidW16DetailSelection(values);
    default: {
      if (EXCHANGE_WHY_STEP_IDS.has(questionId)) {
        const field = getExchangeWhyField(questionId);
        return Boolean(field && values[field]);
      }
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

function resolveChartSliderValue(
  questionId: "w2" | "w3" | "w4" | "w5" | "w6" | "w7",
  values: SalesQualificationValues,
): number | undefined {
  const value = values[questionId];
  return typeof value === "number" ? value : undefined;
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
      ? {
          current: resolveChartSliderValue("w2", values),
          goal: resolveChartSliderValue("w7", values),
        }
      : metricId === "volume"
        ? {
            current: resolveChartSliderValue("w4", values),
            goal: resolveChartSliderValue("w6", values),
          }
        : {
            current: resolveChartSliderValue("w3", values),
            goal: resolveChartSliderValue("w5", values),
          };

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
      goal: showGoal ? currentValue : null,
    },
    {
      t: "Dans 6 mois",
      statuQuo: currentValue,
      goal: goalValue,
    },
    {
      t: "Dans 12 mois",
      statuQuo: currentValue,
      goal: goal12mValue ?? goalValue,
    },
  ];

  let hint =
    "Courbes : écart entre la situation actuelle et la cible à 6 mois.";
  if (!showCurrent && !showGoal) {
    hint = "La projection se trace au fil des réponses sur la situation actuelle et la cible à 6 mois.";
  } else if (showCurrent && !showGoal) {
    hint = "Indiquez la cible à 6 mois pour afficher l'écart projeté.";
  } else if (showCurrent && showGoal) {
    hint =
      "L'écart entre les deux courbes = ce que la méthode actuelle ne comble pas. La projection 12 mois prolonge la trajectoire vers la cible à 6 mois.";
  }

  let annotation: string | undefined;
  const w13WhyLabel = resolveW13WhyLabel(values);
  if (values.w8 && values.w13 === "no" && w13WhyLabel) {
    annotation = `${resolveW8MethodLabel(values)} : ${w13WhyLabel}`;
  } else if (values.w8 && values.w16) {
    annotation = `${resolveW8MethodLabel(values)} · ${resolveUrgencyLabel(values)}`;
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
