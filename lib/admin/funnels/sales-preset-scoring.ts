import { SALES_SKIP_VALUE, type SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

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

function scoreGrowth(values: SalesQualificationValues): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

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

function scoreArchitect(values: SalesQualificationValues): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

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
  if (values.q14.months12 >= 5000) {
    score += 25;
    reasons.push("récurrent 12 mois ≥ 5 000 € / mois");
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
  (values: SalesQualificationValues) => { score: number; reasons: string[] }
> = {
  serial: scoreSerial,
  growth: scoreGrowth,
  architect: scoreArchitect,
  specialist: scoreSpecialist,
  premium: scorePremium,
};

export function scoreAgencyPresets(values: SalesQualificationValues): AgencyPresetResult {
  const scores = {} as AgencyPresetScores;
  const reasonsByPreset = {} as Record<AgencyPresetId, string[]>;

  for (const id of AGENCY_PRESET_IDS) {
    const result = SCORERS[id](values);
    scores[id] = result.score;
    reasonsByPreset[id] = result.reasons;
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

export function scoreAgency(values: SalesQualificationValues): AgencyPresetId {
  return scoreAgencyPresets(values).id;
}
