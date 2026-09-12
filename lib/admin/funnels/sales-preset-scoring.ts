import { SALES_SKIP_VALUE, type SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { isCabinetBuyerSalesAudience, isCifSalesAudience, isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";

export const AGENCY_PRESET_IDS = [
  "serial",
  "growth",
  "architect",
  "specialist",
  "premium",
] as const;

export type AgencyPresetId = (typeof AGENCY_PRESET_IDS)[number];

export type AgencyPresetScores = Record<AgencyPresetId, number>;

export type AgencyPresetResult = {
  id: AgencyPresetId;
  scores: AgencyPresetScores;
  reasons: string[];
};

function includesAny(values: string[], candidates: string[]): boolean {
  return values.some((value) => candidates.includes(value));
}

function scoreSerial(values: SalesQualificationValues): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (values.q3 >= 5) {
    score += 30;
    reasons.push("capacité ≥ 5 projets / mois");
  }
  if (values.q4 === "high" || values.q4 === "moderate") {
    score += 20;
    reasons.push("disponibilité élevée ou modérée");
  }
  if (typeof values.q13 === "number" && values.q13 <= 3000) {
    score += 20;
    reasons.push("ticket ponctuel ≤ 3 000 €");
  }
  if (values.q10 === "all" || values.q10 === "majority") {
    score += 15;
    reasons.push("processus standardisés");
  }
  if (values.q20 >= 3) {
    score += 15;
    reasons.push("capacité Hercule ≥ 3 projets / mois");
  }

  return { score, reasons };
}

function scoreGrowth(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (isCifSalesAudience(audience)) {
    if (includesAny(values.q1, ["patrimoine_epargne", "tresorerie_entreprise", "retraite_prevoyance"])) {
      score += 30;
      reasons.push("offre patrimoine / trésorerie / retraite");
    }
    if (includesAny(values.q2, ["cif_amf", "tresorerie", "ingenierie"])) {
      score += 30;
      reasons.push("expertise CIF / trésorerie / ingénierie");
    }
    if (includesAny(values.q19, ["recurring", "patrimoine_recurrent", "tresorerie"])) {
      score += 25;
      reasons.push("priorité aux mandats récurrents patrimoniaux");
    }
    if (typeof values.q15 === "string" && values.q15.length > 0) {
      score += 15;
      reasons.push("modèle de rémunération déclaré");
    }
    return { score, reasons };
  }

  if (includesAny(values.q1, ["google_ads", "meta_ads", "seo"])) {
    score += 30;
    reasons.push("offre acquisition / SEO");
  }
  if (includesAny(values.q2, ["paid_acquisition", "organic_seo"])) {
    score += 30;
    reasons.push("expertise paid ou organique");
  }
  if (includesAny(values.q19, ["acquisition", "seo", "recurring"])) {
    score += 25;
    reasons.push("priorité aux missions récurrentes d'acquisition");
  }
  if (values.q15 !== SALES_SKIP_VALUE) {
    score += 15;
    reasons.push("budget Paid Ads déclaré");
  }

  return { score, reasons };
}

function scoreArchitect(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (isCifSalesAudience(audience)) {
    if (includesAny(values.q1, ["credit", "fiscal_patrimonial", "obligations_declaratives"])) {
      score += 30;
      reasons.push("offre crédit / fiscal patrimonial / obligations");
    }
    if (includesAny(values.q2, ["iobsp", "ingenierie", "transmission"])) {
      score += 30;
      reasons.push("expertise IOBSP / ingénierie / transmission");
    }
    if (values.q12 === "technical") {
      score += 25;
      reasons.push("appétit pour les mandats d'ingénierie");
    }
    if (includesAny(values.q19, ["one_off", "redesign", "transmission"])) {
      score += 15;
      reasons.push("priorité aux missions ponctuelles / transmission");
    }
    return { score, reasons };
  }

  if (includesAny(values.q1, ["dev", "nocode", "shopify"])) {
    score += 30;
    reasons.push("offre développement / no-code / Shopify");
  }
  if (includesAny(values.q2, ["frontend", "backend", "automation"])) {
    score += 30;
    reasons.push("expertise technique");
  }
  if (values.q12 === "technical") {
    score += 25;
    reasons.push("appétit pour les projets techniques");
  }
  if (values.q19.includes("development")) {
    score += 15;
    reasons.push("priorité aux missions de développement");
  }

  return { score, reasons };
}

function scoreSpecialist(values: SalesQualificationValues): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (values.q2.length > 0 && values.q2.length <= 2) {
    score += 20;
    reasons.push("périmètre d'expertise étroit");
  }
  if (values.q12 === "complex" || values.q12 === "technical") {
    score += 25;
    reasons.push("projets complexes ou techniques");
  }
  if (typeof values.q13 === "number" && values.q13 >= 3500) {
    score += 25;
    reasons.push("ticket ponctuel ≥ 3 500 €");
  }
  if (includesAny(values.q11, ["pme_medium", "eti"])) {
    score += 15;
    reasons.push("cible PME / ETI");
  }
  if (values.q19.includes("high_value")) {
    score += 15;
    reasons.push("priorité aux projets à forte valeur");
  }

  return { score, reasons };
}

function scorePremium(values: SalesQualificationValues): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (values.q3 <= 3) {
    score += 20;
    reasons.push("volume volontairement limité");
  }
  if (typeof values.q13 === "number" && values.q13 >= 5000) {
    score += 30;
    reasons.push("ticket ponctuel ≥ 5 000 €");
  }
  if (
    typeof values.q14 === "object" &&
    values.q14 !== null &&
    "months12" in values.q14 &&
    values.q14.months12 >= 5000
  ) {
    score += 25;
    reasons.push("récurrent 12 mois ≥ 5 000 € / mois");
  } else if (typeof values.q14 === "string" && typeof values.q13 === "number" && values.q13 >= 7200) {
    score += 25;
    reasons.push("honoraires annuels ≥ 7 200 €");
  }
  if (includesAny(values.q11, ["eti", "enterprise"])) {
    score += 15;
    reasons.push("cible ETI / grandes entreprises");
  }
  if (values.q12 === "complex") {
    score += 10;
    reasons.push("appétit pour les projets complexes");
  }

  return { score, reasons };
}

const SCORERS: Record<
  AgencyPresetId,
  (values: SalesQualificationValues, audience?: Audience) => { score: number; reasons: string[] }
> = {
  serial: (values) => scoreSerial(values),
  growth: scoreGrowth,
  architect: scoreArchitect,
  specialist: (values) => scoreSpecialist(values),
  premium: (values) => scorePremium(values),
};

export function scoreAgencyPresets(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): AgencyPresetResult {
  const scores = {} as AgencyPresetScores;
  const reasonsByPreset = {} as Record<AgencyPresetId, string[]>;

  for (const id of AGENCY_PRESET_IDS) {
    const result = SCORERS[id](values, audience);
    scores[id] = result.score;
    reasonsByPreset[id] = localizePresetReasons(result.reasons, audience);
  }

  const winner = AGENCY_PRESET_IDS.reduce((current, candidate) =>
    scores[candidate] > scores[current] ? candidate : current,
  );

  return {
    id: winner,
    scores,
    reasons: reasonsByPreset[winner],
  };
}

export const COMPTABLE_PRESET_REASONS: Record<string, string> = {
  "capacité ≥ 5 projets / mois": "capacité ≥ 5 dossiers / mois",
  "ticket ponctuel ≤ 3 000 €": "honoraires annuels ≤ 3 000 €",
  "capacité Hercule ≥ 3 projets / mois": "capacité Hercule ≥ 3 dossiers / mois",
  "offre acquisition / SEO": "offre fiscal / social / tenue",
  "expertise paid ou organique": "expertise fiscal ou social",
  "priorité aux missions récurrentes d'acquisition": "priorité aux missions récurrentes de tenue",
  "budget Paid Ads déclaré": "budget mission fiscale déclaré",
  "offre développement / no-code / Shopify": "offre outillage / portail / intégrations",
  "expertise technique": "expertise outillage cabinet",
  "appétit pour les projets techniques": "appétit pour les dossiers réglementaires",
  "priorité aux missions de développement": "priorité aux missions juridiques / outillage",
  "projets complexes ou techniques": "dossiers complexes ou réglementaires",
  "ticket ponctuel ≥ 3 500 €": "honoraires ponctuels ≥ 3 500 €",
  "priorité aux projets à forte valeur": "priorité aux dossiers à honoraires élevés",
  "ticket ponctuel ≥ 5 000 €": "honoraires ponctuels ≥ 5 000 €",
  "récurrent 12 mois ≥ 5 000 € / mois": "honoraires annuels ≥ 7 200 €",
  "appétit pour les projets complexes": "appétit pour les dossiers complexes",
  "disponibilité élevée ou modérée": "capacité disponible élevée ou modérée",
  "processus standardisés": "processus cabinet standardisés",
  "périmètre d'expertise étroit": "périmètre de missions étroit",
  "cible PME / ETI": "cible TPE / PME dirigeants",
  "volume volontairement limité": "volume dossiers volontairement limité",
  "cible ETI / grandes entreprises": "cible PME structurée / multi-établissements",
};

export const AGENCY_PRESET_REASON_STRINGS = [
  "capacité ≥ 5 projets / mois",
  "disponibilité élevée ou modérée",
  "ticket ponctuel ≤ 3 000 €",
  "processus standardisés",
  "capacité Hercule ≥ 3 projets / mois",
  "offre acquisition / SEO",
  "expertise paid ou organique",
  "priorité aux missions récurrentes d'acquisition",
  "budget Paid Ads déclaré",
  "offre développement / no-code / Shopify",
  "expertise technique",
  "appétit pour les projets techniques",
  "priorité aux missions de développement",
  "périmètre d'expertise étroit",
  "projets complexes ou techniques",
  "ticket ponctuel ≥ 3 500 €",
  "cible PME / ETI",
  "priorité aux projets à forte valeur",
  "volume volontairement limité",
  "ticket ponctuel ≥ 5 000 €",
  "récurrent 12 mois ≥ 5 000 € / mois",
  "cible ETI / grandes entreprises",
  "appétit pour les projets complexes",
] as const;

export const CIF_PRESET_REASONS: Record<string, string> = {
  "capacité ≥ 5 projets / mois": "capacité ≥ 5 mandats / mois",
  "ticket ponctuel ≤ 3 000 €": "honoraires annuels ≤ 3 000 €",
  "capacité Hercule ≥ 3 projets / mois": "capacité Hercule ≥ 3 mandats / mois",
  "offre patrimoine / trésorerie / retraite": "offre patrimoine / trésorerie / retraite",
  "expertise CIF / trésorerie / ingénierie": "expertise CIF / trésorerie / ingénierie",
  "priorité aux mandats récurrents patrimoniaux": "priorité aux mandats récurrents patrimoniaux",
  "modèle de rémunération déclaré": "modèle de rémunération déclaré",
  "offre crédit / fiscal patrimonial / obligations": "offre crédit / fiscal patrimonial / obligations",
  "expertise IOBSP / ingénierie / transmission": "expertise IOBSP / ingénierie / transmission",
  "appétit pour les mandats d'ingénierie": "appétit pour les mandats d'ingénierie",
  "priorité aux missions ponctuelles / transmission": "priorité aux missions ponctuelles / transmission",
  "projets complexes ou techniques": "mandats complexes ou d'ingénierie",
  "ticket ponctuel ≥ 3 500 €": "honoraires ponctuels ≥ 3 500 €",
  "priorité aux projets à forte valeur": "priorité aux mandats à encours élevés",
  "ticket ponctuel ≥ 5 000 €": "honoraires ponctuels ≥ 5 000 €",
  "honoraires annuels ≥ 7 200 €": "honoraires annuels ≥ 7 200 €",
  "appétit pour les projets complexes": "appétit pour les mandats complexes",
  "disponibilité élevée ou modérée": "capacité disponible élevée ou modérée",
  "processus standardisés": "processus cabinet standardisés",
  "périmètre d'expertise étroit": "périmètre de missions étroit",
  "cible PME / ETI": "cible TPE / PME dirigeants",
  "volume volontairement limité": "volume mandats volontairement limité",
  "cible ETI / grandes entreprises": "cible PME structurée / multi-établissements",
};

function localizePresetReasons(reasons: string[], audience: Audience): string[] {
  if (isCifSalesAudience(audience)) {
    return reasons.map((reason) => CIF_PRESET_REASONS[reason] ?? reason);
  }
  if (isComptableSalesAudience(audience)) {
    return reasons.map((reason) => COMPTABLE_PRESET_REASONS[reason] ?? reason);
  }
  return reasons;
}

export function scoreAgency(
  values: SalesQualificationValues,
  audience: Audience = "agence",
): AgencyPresetId {
  return scoreAgencyPresets(values, audience).id;
}
