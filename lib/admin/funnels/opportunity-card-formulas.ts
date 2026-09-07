import { HERCULE_MONTHLY_MIN } from "@/components/internal/funnels/sales/sales-questions";
import type { AgencyPresetId } from "@/lib/admin/funnels/sales-preset-scoring";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

export type BudgetKind = "one_off" | "monthly";

export const HERCULE_FLOOR_CENTS = HERCULE_MONTHLY_MIN * 100;

export const TIER_MULTIPLIERS = [1.0, 1.15, 1.25, 1.4, 1.65] as const;
export const STRETCH_TIER_INDEX = 4;
export const STRETCH_RATIO = TIER_MULTIPLIERS[STRETCH_TIER_INDEX];
export const DELAYED_TIMING = { min: 27, max: 31 } as const;

export type PrestationType =
  | "site_vitrine"
  | "refonte_site"
  | "ecommerce_build"
  | "integration_complexe"
  | "portail_metier"
  | "acquisition_paid"
  | "seo_organique"
  | "maintenance";

export type TimingClass = "fast" | "normal" | "slow";

export type TailleClass =
  | "freelancers"
  | "tpe"
  | "pme_small"
  | "pme_medium"
  | "eti"
  | "enterprise";

export const TIMING_OFFSETS: Record<TimingClass, { min: number; max: number }> = {
  fast: { min: 7, max: 14 },
  normal: { min: 12, max: 22 },
  slow: { min: 18, max: 28 },
};

export const TIMING_CLASS_RANK: Record<TimingClass, number> = {
  fast: 0,
  normal: 1,
  slow: 2,
};

export const PRESET_FLOOR_OVERRIDE_CENTS: Record<AgencyPresetId, number> = {
  serial: 150_000,
  growth: 150_000,
  architect: 200_000,
  specialist: 350_000,
  premium: 500_000,
};

export const PRESET_TAILLE_FALLBACKS: Record<AgencyPresetId, TailleClass[]> = {
  serial: ["tpe", "pme_small"],
  growth: ["pme_small", "pme_medium"],
  architect: ["pme_small", "pme_medium"],
  specialist: ["pme_medium", "eti"],
  premium: ["eti", "enterprise"],
};

export const TAILLE_SAMPLES: Record<TailleClass, string[]> = {
  freelancers: ["Indépendant", "Profession libérale"],
  tpe: ["TPE — 4 salariés", "TPE — 7 salariés", "TPE — 9 salariés"],
  pme_small: [
    "PME — 12 salariés",
    "PME — 22 salariés",
    "PME — 38 salariés",
    "PME — 45 salariés",
  ],
  pme_medium: ["PME — 60 salariés", "PME — 110 salariés", "PME — 200 salariés"],
  eti: ["ETI — 280 salariés", "ETI — 380 salariés", "Cabinet — 45 associés"],
  enterprise: ["Grand groupe — 800 salariés", "Réseau — 12 établissements"],
};

const MONTHLY_PRESTATION_TYPES = new Set<PrestationType>([
  "acquisition_paid",
  "seo_organique",
  "maintenance",
]);

const HORIZON_COPY: Record<PrestationType, readonly [string, string, string, string, string]> = {
  site_vitrine: [
    "Site en ligne sous 30 jours",
    "Mise en ligne sous 45 jours",
    "Publication prévue avant le prochain trimestre",
    "Site livré avant fin de trimestre",
    "Mise en ligne calée sur la fenêtre interne du client",
  ],
  refonte_site: [
    "Nouvelle version en ligne sous 45 jours",
    "Refonte publiée sous 60 jours",
    "Mise en ligne ciblée avant fin de trimestre",
    "Basculer avant la campagne saisonnière",
    "Refonte livrée après validation du budget interne",
  ],
  ecommerce_build: [
    "Boutique active sous 60 jours",
    "Catalogue en ligne sous 75 jours",
    "Boutique opérationnelle avant le salon professionnel",
    "Ouverture boutique calée sur le prochain trimestre",
    "Mise en production après cadrage stocks et paiements",
  ],
  integration_complexe: [
    "Portail actif sous 75 jours",
    "Intégration opérationnelle sous 90 jours",
    "Système livré avant fin de semestre",
    "Connecteurs stabilisés au 3e mois",
    "Mise en service après validation technique interne",
  ],
  portail_metier: [
    "Espace client actif sous 75 jours",
    "Portail opérationnel sous 90 jours",
    "Parcours métier livré avant fin de semestre",
    "Accès clients ouverts au 3e mois",
    "Déploiement après cadrage des droits et des flux",
  ],
  acquisition_paid: [
    "Premiers contacts sous 40 jours",
    "Pipeline alimenté dès le 2e mois",
    "Reporting stabilisé avant la saison haute",
    "Volume de contacts lisible au 3e mois",
    "Campagnes calées après validation du budget média",
  ],
  seo_organique: [
    "Positions locales suivies sous 60 jours",
    "Visibilité mesurable sous 75 jours",
    "Trafic organique en progression au 4e mois",
    "Requêtes métier suivies dès le 3e mois",
    "Ligne éditoriale en place avant le semestre suivant",
  ],
  maintenance: [
    "Suivi opérationnel dès le premier mois",
    "Mises à jour stabilisées au 2e mois",
    "Rythme trimestriel cadré dès le 3e mois",
    "Continuité technique tenue sur l'année",
    "Astreinte et mises à jour calées après audit initial",
  ],
};

const TAILLE_CLASS_IDS = new Set<string>([
  "freelancers",
  "tpe",
  "pme_small",
  "pme_medium",
  "eti",
  "enterprise",
]);

export function budgetKindFromPrestationType(type: PrestationType): BudgetKind {
  return MONTHLY_PRESTATION_TYPES.has(type) ? "monthly" : "one_off";
}

export function roundToBand(cents: number): number {
  if (cents < 200_000) {
    return Math.round(cents / 2_500) * 2_500;
  }
  if (cents < 1_000_000) {
    return Math.round(cents / 5_000) * 5_000;
  }
  return Math.round(cents / 10_000) * 10_000;
}

export function computeBudgetTiers(floorCents: number): number[] {
  return TIER_MULTIPLIERS.map((multiplier) =>
    Math.max(floorCents, roundToBand(floorCents * multiplier)),
  );
}

export function resolveBudgetFloorCents(
  values: SalesQualificationValues,
  presetId: AgencyPresetId,
): number {
  const candidates = [
    values.q13,
    values.q14?.months3,
    values.q14?.months6,
    values.q14?.months12,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  const declaredMinEur =
    candidates.length > 0 ? Math.min(...candidates) : HERCULE_MONTHLY_MIN;

  return Math.max(
    HERCULE_FLOOR_CENTS,
    declaredMinEur * 100,
    PRESET_FLOOR_OVERRIDE_CENTS[presetId],
  );
}

export function computeDuration(
  type: PrestationType,
  _budgetCents: number,
  _floorCents: number,
  values: SalesQualificationValues,
  slotIndex: number,
): string {
  const slot = Math.min(4, Math.max(0, slotIndex));

  if (type === "acquisition_paid") {
    const months = typeof values.q16 === "number" && values.q16 > 0 ? values.q16 : 6;
    const labels = [
      `${Math.min(6, Math.max(3, months))} mois minimum — acquisition`,
      "6 mois renouvelable — campagnes",
      "9 mois récurrent — acquisition",
      "12 mois minimum — paid media",
      "12 mois avec suivi trimestriel — paid",
    ];
    return labels[slot];
  }

  if (type === "seo_organique") {
    const months = typeof values.q18 === "number" && values.q18 > 0 ? values.q18 : 6;
    const labels = [
      `${Math.min(9, Math.max(6, months))} mois récurrent — SEO`,
      "8 mois récurrent — contenus",
      "9 mois récurrent — organique",
      "12 mois récurrent — SEO",
      "12 mois avec suivi trimestriel — SEO",
    ];
    return labels[slot];
  }

  if (type === "maintenance") {
    const labels = [
      "12 mois récurrent — maintenance",
      "12 mois renouvelable — support",
      "12 mois avec mises à jour trimestrielles",
      "12 mois minimum — infogérance",
      "12 mois avec suivi trimestriel — maintenance",
    ];
    return labels[slot];
  }

  const weekRanges: Record<
    "site_vitrine" | "refonte_site" | "ecommerce_build" | "integration_complexe" | "portail_metier",
    Array<[number, number]>
  > = {
    site_vitrine: [
      [3, 5],
      [4, 6],
      [5, 7],
      [6, 8],
      [7, 10],
    ],
    refonte_site: [
      [5, 7],
      [6, 8],
      [7, 9],
      [8, 10],
      [10, 14],
    ],
    ecommerce_build: [
      [7, 9],
      [8, 10],
      [9, 12],
      [10, 14],
      [12, 16],
    ],
    integration_complexe: [
      [8, 10],
      [10, 12],
      [12, 14],
      [14, 16],
      [14, 18],
    ],
    portail_metier: [
      [10, 12],
      [12, 14],
      [14, 16],
      [16, 18],
      [16, 20],
    ],
  };
  const [low, high] = weekRanges[type][slot];
  const labels = {
    site_vitrine: `Projet vitrine (${low}–${high} semaines)`,
    refonte_site: `Projet de refonte (${low}–${high} semaines)`,
    ecommerce_build: `Projet e-commerce (${low}–${high} semaines)`,
    integration_complexe: `Projet d'intégration (${low}–${high} semaines)`,
    portail_metier: `Projet portail métier (${low}–${high} semaines)`,
  } as const;
  return labels[type];
}

export function computeHorizon(
  type: PrestationType,
  _budgetCents: number,
  _floorCents: number,
  slotIndex: number,
): string {
  const slot = Math.min(4, Math.max(0, slotIndex));
  return HORIZON_COPY[type][slot];
}

export function computeTimingOffsets(
  timingClass: TimingClass,
  delayed: boolean,
): { min: number; max: number } {
  return delayed ? DELAYED_TIMING : TIMING_OFFSETS[timingClass];
}

function asTailleClass(value: string): TailleClass | null {
  return TAILLE_CLASS_IDS.has(value) ? (value as TailleClass) : null;
}

export function computeTaille(
  q11: string[],
  tailleClass: TailleClass,
  slotIndex: number,
  presetId: AgencyPresetId,
): string {
  const declared = q11.map(asTailleClass).filter((value): value is TailleClass => value !== null);
  const classes = declared.length > 0 ? declared : PRESET_TAILLE_FALLBACKS[presetId];
  const preferred = classes.includes(tailleClass) ? tailleClass : classes[slotIndex % classes.length];
  const samples = TAILLE_SAMPLES[preferred];
  return samples[slotIndex % samples.length];
}
