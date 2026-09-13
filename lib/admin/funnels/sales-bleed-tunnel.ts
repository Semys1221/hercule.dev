import type { SalesSliderConfig } from "@/components/internal/funnels/sales/sales-questions";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

const countFormatter = new Intl.NumberFormat("fr-FR");

export type B1GoalType = "more_dossiers" | "better_quality" | "monthly_growth";
export type B3YearId = "y2015" | "y2017" | "y2020" | "y2022" | "y2024";
export type B5MethodId =
  | "word_of_mouth"
  | "seo"
  | "ads"
  | "referrers"
  | "direct"
  | "partnerships"
  | "nothing";

export const B3_YEAR_MAP: Record<B3YearId, number> = {
  y2015: 2015,
  y2017: 2017,
  y2020: 2020,
  y2022: 2022,
  y2024: 2024,
};

export const B5_METHOD_OPTIONS: ReadonlyArray<{ id: B5MethodId; label: string }> = [
  { id: "word_of_mouth", label: "Bouche-à-oreille / réseau" },
  { id: "seo", label: "Référencement / site / contenu (agence SEO)" },
  { id: "ads", label: "Publicité (Google, Meta, annuaires payants)" },
  { id: "referrers", label: "Apporteurs / fichiers achetées" },
  { id: "direct", label: "Prospection directe (email, LinkedIn, appels)" },
  { id: "partnerships", label: "Partenariats (notaires, avocats, réseaux)" },
  { id: "nothing", label: "Rien de structuré" },
];

export const B8_GAP_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "major_gap", label: "Écart majeur sur la marge et l'occupation" },
  { id: "significant_gap", label: "Écart significatif — équipe sous-utilisée" },
  { id: "moderate_gap", label: "Écart modéré mais récurrent qui freine la croissance" },
  { id: "near_target", label: "Proche de l'objectif — écart sur un levier précis" },
  { id: "at_capacity", label: "Déjà à la cible sur le volume (autre frein)" },
];

const B7_OPTIONS_BY_METHOD: Record<B5MethodId, ReadonlyArray<{ id: string; label: string }>> = {
  seo: [
    { id: "seo_delay", label: "Délai 6–12 mois sans preuve de retour" },
    { id: "seo_rent", label: "Visibilité locataire — arrêt du budget = zéro flux" },
    { id: "seo_keywords", label: "Confrères sur les mêmes mots-clés de zone" },
    { id: "seo_no_asset", label: "Pas d'actif propriétaire — tout repart de zéro chaque fois" },
  ],
  ads: [
    { id: "ads_cac", label: "Coût par demande trop élevé pour les honoraires visés" },
    { id: "ads_unqualified", label: "Demandes hors zone / hors typologie" },
    { id: "ads_stop", label: "Couper la campagne = flux à zéro immédiat" },
    { id: "ads_no_asset", label: "Aucun actif — uniquement de la location d'attention" },
  ],
  word_of_mouth: [
    { id: "wom_scale", label: "Non scalable — dépend des relations existantes" },
    { id: "wom_aging", label: "Portefeuille qui vieillit sans renouvellement prévisible" },
    { id: "wom_random", label: "Flux aléatoire — pas de prévisibilité sur 6 mois" },
    { id: "wom_zone", label: "Zone sous-exploitée — peu de bouche-à-oreille entrante" },
  ],
  referrers: [
    { id: "ref_stale", label: "Fiches périmées ou déjà contactées" },
    { id: "ref_shared", label: "Pas d'exclusivité — même fichier à plusieurs cabinets" },
    { id: "ref_commission", label: "Commission qui érode la marge" },
    { id: "ref_quality", label: "Peu de correspondance honoraires / typologie" },
  ],
  direct: [
    { id: "dir_bandwidth", label: "Bande passante associée insuffisante" },
    { id: "dir_image", label: "Image cabinet — prospection perçue comme intrusive" },
    { id: "dir_cadence", label: "Cadence trop faible pour combler l'écart" },
    { id: "dir_skills", label: "Pas de process commercial structuré" },
  ],
  partnerships: [
    { id: "part_inactive", label: "Partenaires peu actifs" },
    { id: "part_reciproque", label: "Pas de réciproque — le flux ne revient pas" },
    { id: "part_zone", label: "Hors zone ou hors cible" },
    { id: "part_dependency", label: "Dépendance à un seul partenaire" },
  ],
  nothing: [
    { id: "nothing_infra", label: "Jamais d'infrastructure d'acquisition" },
    { id: "nothing_network", label: "Dépendance totale au réseau personnel" },
    { id: "nothing_visibility", label: "Invisibilité au moment du besoin sur la zone" },
    { id: "nothing_time", label: "Pas de temps associé dédié au développement" },
  ],
};

export function getB7Options(methodId: string): ReadonlyArray<{ id: string; label: string }> {
  if (methodId in B7_OPTIONS_BY_METHOD) {
    return B7_OPTIONS_BY_METHOD[methodId as B5MethodId];
  }
  return [];
}

export function resolvePrimaryMethodId(values: SalesQualificationValues): string {
  if (values.b5b) {
    return values.b5b;
  }
  return values.b5?.[0] ?? "";
}

export function resolveMethodLabel(values: SalesQualificationValues): string {
  const methodId = resolvePrimaryMethodId(values);
  return B5_METHOD_OPTIONS.find((option) => option.id === methodId)?.label ?? "";
}

export function getCabinetSliderConfig(
  b1: B1GoalType | string | undefined,
  role: "current" | "target",
  audience: "comptable" | "cif" = "comptable",
): SalesSliderConfig {
  if (b1 === "better_quality") {
    return {
      min: 2400,
      max: 6000,
      step: 100,
      unit: "eur_year",
      defaultValue: role === "current" ? 3000 : 4000,
    };
  }
  if (b1 === "monthly_growth") {
    return {
      min: 500,
      max: 15000,
      step: 100,
      unit: "eur_month",
      defaultValue: role === "current" ? 2000 : 4000,
    };
  }
  return {
    min: 0,
    max: 15,
    step: 1,
    unit: "count",
    defaultValue: role === "current" ? 3 : 6,
  };
}

export function formatCabinetSliderValue(
  value: number | undefined,
  b1: B1GoalType | string | undefined,
  audience: "comptable" | "cif" = "comptable",
): string {
  if (typeof value !== "number") {
    return "";
  }
  if (b1 === "more_dossiers" || !b1) {
    const unit = audience === "cif" ? "mandats / mois" : "dossiers / mois";
    return `${value} ${unit}`;
  }
  return countFormatter.format(value);
}

export function resolveB7Label(values: SalesQualificationValues): string {
  const methodId = resolvePrimaryMethodId(values);
  const options = getB7Options(methodId);
  return options.find((option) => option.id === values.b7)?.label ?? "";
}

export function resolveB8Label(values: SalesQualificationValues): string {
  return B8_GAP_OPTIONS.find((option) => option.id === values.b8)?.label ?? "";
}

export function resolveB3Year(values: SalesQualificationValues): number | undefined {
  if (values.b3Year) {
    return values.b3Year;
  }
  if (values.b3 && values.b3 in B3_YEAR_MAP) {
    return B3_YEAR_MAP[values.b3 as B3YearId];
  }
  return undefined;
}

export function getB5bOptions(
  values: SalesQualificationValues,
): ReadonlyArray<{ id: string; label: string }> {
  const selected = values.b5 ?? [];
  return B5_METHOD_OPTIONS.filter((option) => selected.includes(option.id));
}

export const B6_TRAP_TEMPLATE =
  "Depuis **{year}**, le cabinet vise **{goal}** (actuellement **{current}**). Le levier principal déclaré est **{method}**.\n**Pourquoi {method} n'a pas permis d'atteindre {goal} sur cette période ?**";

export const DIAGNOSTIC_MIRROR_TEMPLATE =
  "Aujourd'hui : objectif **{goal}** · actuel **{current}** · depuis **{year}** · **{method}** bridé par **{cause}**. La suite déploie le système sur cet écart.";

export const CABINET_OBJECTIFS_SUBTITLE =
  "Qualification courte : où va le cabinet, où il en est, et ce qui bloque depuis l'ouverture. On va droit au but.";

export function formatCabinetBleedInterpolation(
  template: string,
  values: SalesQualificationValues,
  audience: "comptable" | "cif" = "comptable",
): string {
  const year = resolveB3Year(values);
  const goal = formatCabinetSliderValue(values.b4, values.b1, audience);
  const current = formatCabinetSliderValue(values.b2, values.b1, audience);
  const method = resolveMethodLabel(values);
  const cause = resolveB7Label(values);

  return template
    .replace(/\{year\}/g, year ? String(year) : "—")
    .replace(/\{goal\}/g, goal || "—")
    .replace(/\{current\}/g, current || "—")
    .replace(/\{method\}/g, method || "—")
    .replace(/\{cause\}/g, cause || "—")
    .replace(/\{gap\}/g, resolveB8Label(values) || "—");
}

export function isBleedQuestionVisible(
  questionId: string,
  values: SalesQualificationValues,
): boolean {
  if (questionId === "b5b") {
    return (values.b5?.length ?? 0) > 1;
  }
  if (questionId === "b6" || questionId === "b7" || questionId === "b8" || questionId === "diagnostic_card") {
    const b5Count = values.b5?.length ?? 0;
    if (b5Count === 0) {
      return false;
    }
    if (b5Count > 1 && !values.b5b) {
      return questionId !== "b6";
    }
    if (questionId === "b7") {
      return Boolean(resolvePrimaryMethodId(values));
    }
    if (questionId === "b8") {
      return Boolean(values.b7);
    }
    if (questionId === "diagnostic_card") {
      return Boolean(values.b8);
    }
    return true;
  }
  return true;
}
