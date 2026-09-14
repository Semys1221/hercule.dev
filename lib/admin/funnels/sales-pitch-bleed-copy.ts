import { buildBleedTrack, interpolateBleed } from "@/lib/admin/funnels/sales-bleed-track";
import {
  formatObjectifsWizardInterpolation,
  resolveUrgencyLabel,
  resolveW13WhyLabel,
  resolveW8MethodLabel,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import type { PitchInterpolationContext } from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";

export type PitchChoiceOption = {
  id: string;
  label: string;
};

export const PITCH_P2_MISSING_ROLE_IDS = [
  "associate",
  "managing_partner",
  "expert_referent",
  "ops_director",
  "reschedule",
] as const;

export type PitchP2MissingRoleId = (typeof PITCH_P2_MISSING_ROLE_IDS)[number];

export const PITCH_P11_WHY_IDS = [
  "zone_lock",
  "close_gap",
  "owned_asset",
  "guarantee_roi",
  "replace_method",
  "urgency",
  "criteria_fit",
] as const;

export type PitchP11WhyId = (typeof PITCH_P11_WHY_IDS)[number];

export const PITCH_P12_CORE_WHY_IDS = [
  "controlled_budget",
  "gradual_deploy",
  "capacity_match",
] as const;

export const PITCH_P12_HORIZON_WHY_IDS = [
  "guarantee_20_rdv",
  "max_capture",
  "gap_ambition",
] as const;

export type PitchP12WhyId =
  | (typeof PITCH_P12_CORE_WHY_IDS)[number]
  | (typeof PITCH_P12_HORIZON_WHY_IDS)[number];

export const PITCH_P0_TRANSITION_TEMPLATE =
  "[Prénom], le cabinet vise {goal6m} — et c'est exactement ce qu'on va structurer. Mais pour que la qualité tienne et que le récurrent suive, on n'utilise pas des méthodes de spammeurs. On déploie une infrastructure : le Moteur Hercule Foundation — en remplacement de {method}.";

export const PITCH_P1_METHOD_CONTEXT_TEMPLATE =
  "Le cabinet déclare {method} depuis {year} — la suite pose une infrastructure qui ne dépend pas de ce canal.";

export const PITCH_P1B_BRAKE_CALLOUT_TEMPLATE =
  "Ce que le cabinet a identifié — {brake} — c'est précisément le type de friction que Foundation est conçu pour contourner.";

export const PITCH_P3_DIFFERENTIATION_LEAD_TEMPLATE =
  "La plupart des cabinets qui passent cette session ont déjà testé {method}. Hercule est branché sur les flux légaux (Pappers, INSEE) — pas sur la pub Facebook. L'enjeu ici : traiter {cause}, pas empiler une campagne de plus.";

export const PITCH_P4_PILLARS_SUBTITLE_TEMPLATE =
  "Objectif déclaré : passer de {currentSnapshot} à {goal6m} — les trois piliers couvrent capture, exécution et relation.";

export const PITCH_P5_CAPTURE_INTRO_TEMPLATE =
  "Aujourd'hui le levier principal est {method} — Capture intercepte l'intention au moment du besoin légal, au nom du cabinet.";

export const PITCH_P6_COMPARISON_INTRO_TEMPLATE =
  "Depuis {year}, {method} n'a pas tenu la promesse — {brake}. Voici pourquoi Foundation n'est pas du SEO :";

export const PITCH_P8_ACTIVATION_HOOK_TEMPLATE =
  "Sans activation, {inaction} continue de coûter {gap} — à J+60 le système doit tourner, pas rester en projet.";

export const PITCH_CGV_GUARANTEE_HOOK_TEMPLATE =
  "La garantie 20 RDV B2B en 3 mois couvre l'écart {gap} que le cabinet a chiffré — honoraires déclarés : {honoraires}.";

export const PITCH_P9_INBOUND_HOOK_TEMPLATE =
  "Chaque demande inbound liée à {cause} doit être traitée sous 24 h — sinon la capture se vide vers un confrère.";

export const PITCH_P10_ZONE_BODY_TEMPLATE =
  "Sans verrou aujourd'hui, {inaction} continue sur {department} — un seul cabinet par zone.";

export const PITCH_PROI_GOAL_RECAP_TEMPLATE =
  "Trajectoire validée : {currentSnapshot} → {goal6m} — le contrat dimensionne l'investissement sur cet écart.";

export const PITCH_P_DASHBOARD_GOAL_CALLOUT_TEMPLATE =
  "Objectif de session : {goal6m} — le dashboard finalise l'activation sur cette cible.";

export const PITCH_P12_PLAN_RECAP_TEMPLATE =
  "Pour combler {gap} vers {goal6m}, choisissez l'infrastructure adaptée au rythme du cabinet.";

const P11_WHY_LABEL_TEMPLATES: Record<PitchP11WhyId, string> = {
  zone_lock: "Verrouiller la zone avant un confrère",
  close_gap: "Combler l'écart {gap} vers {goal6m}",
  owned_asset: "Construire un actif propriétaire, pas louer l'attention",
  guarantee_roi: "Sécuriser le bénéfice contractuel (20 RDV B2B / 3 mois)",
  replace_method: "{method} ne tient pas — {brake}",
  urgency: "Urgence : {urgencyLabel}",
  criteria_fit: "Partenaire aligné sur : {criteria}",
};

const P12_CORE_WHY_LABELS: Record<(typeof PITCH_P12_CORE_WHY_IDS)[number], string> = {
  controlled_budget: "Maîtriser l'investissement mensuel — bases suffisantes pour démarrer",
  gradual_deploy: "Déploiement progressif — valider le système avant de scaler le volume",
  capacity_match: "Capacité cabinet limitée — Core correspond au rythme d'absorption actuel",
};

const P12_HORIZON_WHY_LABELS: Record<(typeof PITCH_P12_HORIZON_WHY_IDS)[number], string> = {
  guarantee_20_rdv: "Garantie 20 RDV B2B planifiés en 3 mois",
  max_capture: "Capture maximale sur la zone — levier complet",
  gap_ambition: "Écart {gap} — il faut le levier complet pour {goal6m}",
};

function interpolatePitchChoiceLabel(
  template: string,
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): string {
  const merged = mergeSalesQualificationValues(values, audience);
  const bleed = buildBleedTrack(merged, audience);
  const withObjectifs = formatObjectifsWizardInterpolation(template, merged, audience);
  const withBleed = interpolateBleed(withObjectifs, bleed);
  const firstName = context?.prospectFirstName?.trim() || "le cabinet";
  return withBleed.replace(/\[Prénom\]/g, firstName);
}

function getVisibleP11WhyIds(values: SalesQualificationValues): PitchP11WhyId[] {
  const visibleIds: PitchP11WhyId[] = [
    "zone_lock",
    "close_gap",
    "owned_asset",
    "guarantee_roi",
  ];

  if (shouldShowP11ReplaceMethod(values)) {
    visibleIds.push("replace_method");
  }
  if (shouldShowP11Urgency(values)) {
    visibleIds.push("urgency");
  }
  if (shouldShowP11CriteriaFit(values)) {
    visibleIds.push("criteria_fit");
  }

  return visibleIds;
}

export function getPitchP2MissingRoleOptions(audience: Audience): PitchChoiceOption[] {
  const expertLabel = isCifSalesAudience(audience)
    ? "CGP référent"
    : "Expert-comptable référent";

  return [
    { id: "associate", label: "Associé / associée" },
    { id: "managing_partner", label: "Associé gérant" },
    { id: "expert_referent", label: expertLabel },
    { id: "ops_director", label: "Directeur / responsable développement" },
    { id: "reschedule", label: "Replanifier avec le décideur manquant" },
  ];
}

function shouldShowP11ReplaceMethod(values: SalesQualificationValues): boolean {
  return values.w13 === "no";
}

function shouldShowP11Urgency(values: SalesQualificationValues): boolean {
  return Boolean(values.w16) || values.w15 === "shortcut";
}

function shouldShowP11CriteriaFit(_values: SalesQualificationValues): boolean {
  return false;
}

export function getPitchP11WhyOptions(
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): PitchChoiceOption[] {
  return getVisibleP11WhyIds(values).map((id) => ({
    id,
    label: interpolatePitchChoiceLabel(P11_WHY_LABEL_TEMPLATES[id], values, audience, context),
  }));
}

export function isPitchP11WhyIdValid(
  whyId: string | undefined,
  values: SalesQualificationValues,
  audience: Audience,
  _context?: PitchInterpolationContext,
): boolean {
  if (!whyId) {
    return false;
  }
  return getVisibleP11WhyIds(values).includes(whyId as PitchP11WhyId);
}

export function getPitchP12WhyOptions(
  plan: "core" | "horizon" | undefined,
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): PitchChoiceOption[] {
  if (plan === "core") {
    return PITCH_P12_CORE_WHY_IDS.map((id) => ({
      id,
      label: P12_CORE_WHY_LABELS[id],
    }));
  }

  if (plan === "horizon") {
    return PITCH_P12_HORIZON_WHY_IDS.map((id) => ({
      id,
      label: interpolatePitchChoiceLabel(P12_HORIZON_WHY_LABELS[id], values, audience, context),
    }));
  }

  return [];
}

export function isPitchP12WhyIdValid(
  whyId: string | undefined,
  plan: "core" | "horizon" | undefined,
  _values: SalesQualificationValues,
  _audience: Audience,
  _context?: PitchInterpolationContext,
): boolean {
  if (!whyId || !plan) {
    return false;
  }
  const allowedIds =
    plan === "core" ? PITCH_P12_CORE_WHY_IDS : plan === "horizon" ? PITCH_P12_HORIZON_WHY_IDS : [];
  return allowedIds.includes(whyId as (typeof allowedIds)[number]);
}

export function isPitchP2MissingRoleValid(
  role: string | undefined,
  audience: Audience,
): boolean {
  if (!role) {
    return false;
  }
  return getPitchP2MissingRoleOptions(audience).some((option) => option.id === role);
}

export function resolvePitchMethodLabel(values: SalesQualificationValues): string {
  return resolveW8MethodLabel(values) || "la méthode actuelle";
}

export function resolvePitchBrakeLabel(values: SalesQualificationValues): string {
  return resolveW13WhyLabel(values) || resolveUrgencyLabel(values) || "le frein déclaré";
}

export function resolvePitchCriteriaSummary(_values: SalesQualificationValues): string {
  return "vos critères de décision";
}
