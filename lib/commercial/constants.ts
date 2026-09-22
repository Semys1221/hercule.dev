/**
 * lib/commercial/constants.ts — Source of truth for all commercial values.
 *
 * Decisions: ENG-16, CPY-01, CPY-04, CAP-01, BIZ-10, BIZ-02.
 *
 * DO NOT duplicate these values in React components or email templates.
 * DO NOT parse cvg_master.md at runtime — read this module instead.
 * VITRINE_ONLY entries must never appear in payments.offer_type.
 */

export const PAYMENT_PHASES = {
  deposit: "deposit",
  balance: "balance",
  /** Agence — paiement intégral (option Fast, livraison accélérée). */
  full: "full",
} as const;

export type PaymentPhase = (typeof PAYMENT_PHASES)[keyof typeof PAYMENT_PHASES];

export const COMMERCIAL = {
  /** Hercule Starter — 998 €, 5 contrats PME / 30 j */
  starter998PriceCents: 99_800,
  starter998Attributions: 5,
  starter998DeliveryDays: 30,
  starter998FormulaLabel: "5 contrats PME sécurisés",

  /** Hercule Growth — 1 498 €, 10 contrats PME / 60 j */
  growth1498PriceCents: 149_800,
  growth1498Attributions: 10,
  growth1498DeliveryDays: 60,
  growth1498FormulaLabel: "10 contrats PME sécurisés",

  /** Legacy Hercule Starter — 1 489 € one-shot, 5 attributions */
  starterPriceCents: 148_900,
  starterAttributions: 5,
  starterFormulaLabel: "5 rendez-vous qualifiés",
  starterGuaranteeMrrCents: 150_000,
  starterGuaranteeMaxReplacements: 5,

  /** Mensuel sans engagement — 1 489 €/mois (renouvellement) */
  monthlyPriceCents: 148_900,

  /** Pack 3 mois — 989 €/mois × 3 */
  pack989x3UnitCents: 98_900,
  pack989x3TotalCents: 296_700,
  pack989x3Attributions: 15,

  /** Garantie pack: si CA via Hercule < 4 500 € → jusqu'à 15 remplacements */
  packGuaranteeCaCents: 450_000,
  packGuaranteeMaxReplacements: 15,

  /** RDV honoré si durée ≥ 15 min */
  honorMinutesMin: 15,

  /** No-show entreprise : recrédit + remplacement ≤ 14 j ouvrés */
  noshowReplaceWorkingDays: 14,
  /** No-show doit être signalé ≤ 48 h */
  noshowReportHours: 48,

  /** Délais email vente */
  confirmRelanceHours: 24,

  /** SLA livraison standard */
  firstHonoredDaysStandard: 21,
  firstHonoredDaysConstrained: 28,

  /** Agence dashboard — premier RDV après activation (paiement 50/50, jours calendaires). */
  agenceStandardFirstRdvCalendarDays: 30,
  /** Label affiché — paiement 50/50. */
  agenceStandardDeliveryDaysLabel: "30 jours",
  /** Agence dashboard — premier RDV après activation (paiement intégral Fast, jours ouvrés). */
  agenceFastFirstRdvWorkingDays: 8,

  /** SLA volume honoré / mois @ allocation 30 inbox (mensuel) */
  volumeHonoredPerMonthStandard: { min: 3, max: 4 } as const,

  /** Accès onboarding après paiement */
  onboardingAccessHours: 48,

  /** Liste d'attente max */
  waitingListMaxDays: 15,

  /** Rétractation commerciale (CGV §8) */
  retractationDays: 4,

  /** Hercule Libéral — accès pipeline agence (abonnement mensuel). */
  herculeLiberalMonthlyPriceCents: 120_000,
} as const;

/** Pipeline agence — produit SaaS « Hercule Libéral » (checkout public). */
export const HERCULE_LIBERAL = {
  productName: "Hercule Libéral",
  monthlyPriceCents: COMMERCIAL.herculeLiberalMonthlyPriceCents,
  offerType: "hercule_liberal_1200_monthly",
} as const;

/**
 * Offer types used in payments.offer_type — agence (Web/Tech) offers.
 * Must match CHECK constraint in Supabase migrations.
 */
export const OFFER_TYPES = {
  starter998_5: "starter_998_5",
  growth1498_10: "growth_1498_10",
  starter1489_5: "starter_1489_5",
  monthly1489: "monthly_1489",
  pack989x3: "pack_989x3",
  /** SaaS autonome — 10 RDV bookés / mois @ 30 inbox */
  saasAutonome10rdv: "saas_autonome_10rdv",
} as const;

export type OfferType = (typeof OFFER_TYPES)[keyof typeof OFFER_TYPES];

export const AGENCE_CHECKOUT_OFFER_TYPES = [
  OFFER_TYPES.starter998_5,
  OFFER_TYPES.growth1498_10,
] as const;

export type AgenceCheckoutOfferType = (typeof AGENCE_CHECKOUT_OFFER_TYPES)[number];

export function formatAgenceStandardFirstRdvLabel(): string {
  return `${COMMERCIAL.agenceStandardFirstRdvCalendarDays} jours`;
}

export function formatAgenceFastFirstRdvLabel(): string {
  return `${COMMERCIAL.agenceFastFirstRdvWorkingDays} jours ouvrés`;
}

/** Comptable — fourchette SLA premier RDV planifié (jours calendaires après activation). */
export function formatComptableFirstRdvLabel(): string {
  return `${COMMERCIAL_COMPTABLE.firstRdvDaysMin} à ${COMMERCIAL_COMPTABLE.firstRdvDaysMax} jours`;
}

export function formatComptableFirstRdvAfterActivationLabel(): string {
  return `${formatComptableFirstRdvLabel()} après activation`;
}

export function formatComptableOnboardingAccessLabel(): string {
  return `${COMMERCIAL.onboardingAccessHours} heures`;
}

export function depositCents(totalCents: number): number {
  return Math.floor(totalCents / 2);
}

export function balanceCents(totalCents: number): number {
  return totalCents - depositCents(totalCents);
}

export function totalPriceCentsForOffer(offerType: string): number {
  if (offerType === OFFER_TYPES.growth1498_10) {
    return COMMERCIAL.growth1498PriceCents;
  }
  if (offerType === OFFER_TYPES.starter998_5) {
    return COMMERCIAL.starter998PriceCents;
  }
  if (offerType === OFFER_TYPES.pack989x3) {
    return COMMERCIAL.pack989x3TotalCents;
  }
  return COMMERCIAL.starterPriceCents;
}

export function attributionsForOfferType(offerType: string | null | undefined): number {
  if (offerType === OFFER_TYPES.growth1498_10) {
    return COMMERCIAL.growth1498Attributions;
  }
  if (offerType === OFFER_TYPES.pack989x3) {
    return COMMERCIAL.pack989x3Attributions;
  }
  if (offerType === OFFER_TYPES.starter998_5) {
    return COMMERCIAL.starter998Attributions;
  }
  return COMMERCIAL.starterAttributions;
}

export function formulaLabelForOfferType(offerType: string | null | undefined): string {
  if (offerType === OFFER_TYPES.growth1498_10) {
    return COMMERCIAL.growth1498FormulaLabel;
  }
  if (offerType === OFFER_TYPES.starter998_5) {
    return COMMERCIAL.starter998FormulaLabel;
  }
  if (offerType === OFFER_TYPES.pack989x3) {
    return `${COMMERCIAL.pack989x3Attributions} rendez-vous qualifiés`;
  }
  return COMMERCIAL.starterFormulaLabel;
}

/** Legacy `monthly_1489` rows were one-shot Starter checkouts before starter_1489_5 existed. */
export function isStarterLikeOfferType(offerType: string | null | undefined): boolean {
  return (
    offerType === OFFER_TYPES.starter998_5 ||
    offerType === OFFER_TYPES.starter1489_5 ||
    offerType === OFFER_TYPES.monthly1489
  );
}

export function isGrowthOfferType(offerType: string | null | undefined): boolean {
  return offerType === OFFER_TYPES.growth1498_10;
}

export function isLegacyAgenceOfferType(offerType: string | null | undefined): boolean {
  return (
    offerType === OFFER_TYPES.starter1489_5 ||
    offerType === OFFER_TYPES.monthly1489 ||
    offerType === OFFER_TYPES.pack989x3
  );
}

/**
 * Offer types used in payments.offer_type — comptable offers.
 * Must match CHECK constraint in Supabase migrations (20261010120000_payments_comptable).
 */
export const OFFER_TYPES_COMPTABLE = {
  starter999_5: "starter_999_5",
  monthly1499: "monthly_1499",
  /** DEC monthly with Stripe trial_period_days=14 then 1 499 €/mois. */
  monthly1499Trial: "monthly_1499_trial",
  pack3x1499: "pack_3x1499",
  /** Acquisition comptable — 1 489 €/mois, 10–15 RDV (Payment Link closer). */
  acquisition1489_1m: "comptable_acquisition_1489_1m",
} as const;

/** Checkout / webhook metadata.product for free-trial subscription. */
export const FREE_TRIAL_STRIPE_PRODUCT = "free_trial" as const;

/** Trial length in days for monthly_1499_trial checkout. */
export const FREE_TRIAL_PERIOD_DAYS = 14 as const;

export type OfferTypeComptable = (typeof OFFER_TYPES_COMPTABLE)[keyof typeof OFFER_TYPES_COMPTABLE];

/**
 * Vitrine-only pricing — display in marketing copy only.
 * NEVER write to payments.offer_type.
 */
export const VITRINE_ONLY = {
  hercule2500MonthlyCents: 250_000,
} as const;

/**
 * Strings that must never appear in email templates or UI copy.
 * Tested in constants.test.ts.
 */
export const FORBIDDEN_COPY = [
  "898",
  "1 500 €",
  "1500€",
  "MEETING_10",
] as const;

/**
 * Cabinets d'expertise comptable — separate commercial terms.
 * Stripe offer types: OFFER_TYPES_COMPTABLE (starter_999_5 / monthly_1499 / pack_3x1499).
 */
export const COMMERCIAL_COMPTABLE = {
  /**
   * Hercule Mercantile (DEC) — canon pricing v3.
   * Notion DB Offres = master. Legacy Lite/Starter/MRR removed.
   * Offer types Stripe retained for payment compatibility.
   */
  /** @deprecated Lite removed — alias to DEC monthly for legacy offer type starter_999_5 */
  starterPriceCents: 149_900,
  liteMissionsPerMonth: 10,
  /** @deprecated Use growthMissionsPerMonth */
  starterMissions: 10,

  /** Hercule Mercantile — 1 499 € / 1 mois, 10 RDV garantis (offer type monthly_1499) */
  growthMonthlyPriceCents: 149_900,
  monthlyPriceCents: 149_900,
  growthMissionsPerMonth: 10,
  /** Durée formule mensuelle DEC (canon v4) */
  commitmentMonths: 1,
  /** MRR garantie supprimée v2 */
  growthGuaranteeMrrCents: 0,
  growthGuaranteeMaxReplacements: 0,

  /**
   * @deprecated Canon v3 — no discounted pack 3 mois; engagement is trimestriel at 1 499 €/mois.
   * Kept for legacy payment rows / Stripe offer type pack_3x1499.
   */
  pack3TotalCents: 359_800,
  pack3MissionsTotal: 30,
  pack3GuaranteeMrrCents: 0,
  pack3GuaranteeMaxReplacements: 0,

  billingCycleDays: 30,

  /** SLA premier RDV — warm-up post-paiement (ne pas afficher sur slide prix) */
  firstRdvDaysMin: 20,
  firstRdvDaysMax: 25,

  /** Acquisition 1 mois — Payment Link 1 489 €, livrable 10–15 RDV */
  acquisition1489PriceCents: 148_900,
  acquisition1489RdvMin: 10,
  acquisition1489RdvMax: 15,
  acquisition1489FirstRdvCalendarDays: 25,

  /** Honoraires modèle client final DEC (stack Comptable Tech) */
  mrrPerSignedMissionCents: 49_000,

  valueShowcaseAnnualHonorairesCents: 360_000,
  valueShowcaseAnnualHonorairesLabel: "3 600 €",

  honorairesAnnuelsMinCents: 240_000,
  honorairesAnnuelsMinLabel: "2 400 €",

  honorairesAnnuelsMaxVitrineCents: 600_000,
  honorairesAnnuelsMaxVitrineLabel: "6 000 €",

  honorairesPonctuelMinCents: 80_000,
  honorairesPonctuelMinLabel: "800 €",

  minAssociatesOrCollaborators: 3,

  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,

  /** Display names — canon v3 */
  coreDisplayName: "Hercule Mercantile",
  horizonDisplayName: "Hercule Mercantile",
  coreDisplayPriceCents: 149_900,
  horizonDisplayPriceCents: 149_900,
  horizonGuaranteeRdvCount: 10,
  horizonGuaranteeMonths: 1,
  horizonGuaranteeDays: 30,
  coreTagline: "1 mois · 10 RDV garantis · 30 j de test · restaurants +3 sal.",
  horizonTagline: "1 mois · 10 RDV garantis · 30 j de test · restaurants BIC · 0 % commission",
} as const;

/** Bullets canon — offre DEC mensuelle (conférence, CGV, marketing). */
export const DEC_MONTHLY_OFFER_BULLETS = [
  "10 rendez-vous qualifiés garantis.",
  "Vous disposez de 30 jours pour tester le dispositif.",
  "Si les 10 rendez-vous ne sont pas générés pendant votre abonnement, nous poursuivons la prospection pendant 30 jours supplémentaires, sans frais, afin de compléter les rendez-vous restants.",
] as const;

/**
 * Hercule Hubris — canon pricing v3 (IAS + CIF bundle).
 * Replaces standalone IAS 1 999 €/mois and CIF 3 499 €/90j.
 */
export const COMMERCIAL_HERCULE_HUBRIS = {
  optionAFlatCents: 400_000,
  optionBMonthlyCents: 180_000,
  commitmentMonths: 3,
  creditsPerQuarterMin: 15,
  creditsPerQuarterMax: 20,
  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,
  offerTypeOptionA: "hercule_hubris_4000_flat",
  offerTypeOptionB: "hercule_hubris_1800_monthly",
} as const;

/** @deprecated Use COMMERCIAL_HERCULE_HUBRIS */
export const COMMERCIAL_HUBRIS_IMPERIAL = COMMERCIAL_HERCULE_HUBRIS;

/**
 * @deprecated Canon v3 — IAS no longer listed alone. Use COMMERCIAL_HERCULE_HUBRIS.
 * Values retained for legacy scripts / payment rows.
 */
export const COMMERCIAL_IAS = {
  monthlyPriceCents: 199_900,
  pack3TotalCents: 479_800,
  creditsPerMonth: 10,
  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,
} as const;

/**
 * @deprecated Canon v3 — CIF no longer listed alone. Use COMMERCIAL_HERCULE_HUBRIS.
 * Values retained for legacy scripts / payment rows.
 */
export const COMMERCIAL_CIF = {
  pack90PriceCents: 349_900,
  creditsPerPeriod: 20,
  periodDays: 90,
  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,
} as const;

/** Comptable — acquisition 1 mois via Payment Link (1 489 €/mois). */
export const COMPTABLE_ACQUISITION_1489 = {
  productName: "Hercule Comptable — Acquisition 1 mois",
  monthlyPriceCents: COMMERCIAL_COMPTABLE.acquisition1489PriceCents,
  offerType: OFFER_TYPES_COMPTABLE.acquisition1489_1m,
} as const;

export type FoundationPricingPlanId = "core" | "horizon";

export type FoundationPricingPlan = {
  id: FoundationPricingPlanId;
  offerType: OfferTypeComptable;
  name: string;
  priceCents: number;
  tagline: string;
  features: readonly string[];
  recommended?: boolean;
};

const foundationEuroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatFoundationEuros(cents: number): string {
  return foundationEuroFormatter.format(cents / 100);
}

export function formatFoundationGuaranteeRdvLabel(): string {
  return `${COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount} RDV B2B sur ${COMMERCIAL_COMPTABLE.horizonGuaranteeDays} jours`;
}

export const FOUNDATION_PRICING_PLANS: readonly FoundationPricingPlan[] = [
  {
    id: "core",
    offerType: OFFER_TYPES_COMPTABLE.starter999_5,
    name: COMMERCIAL_COMPTABLE.coreDisplayName,
    priceCents: COMMERCIAL_COMPTABLE.coreDisplayPriceCents,
    tagline: COMMERCIAL_COMPTABLE.coreTagline,
    features: [
      "Déploiement du Moteur Hercule Foundation sur la zone du cabinet.",
      "Capture inbound standard — événements légaux, demandes qualifiées.",
      "0 % de commission sur vos honoraires signés.",
      "Garantie no-show : recrédit et remplacement sous 14 jours ouvrés.",
    ],
  },
  {
    id: "horizon",
    offerType: OFFER_TYPES_COMPTABLE.monthly1499,
    name: COMMERCIAL_COMPTABLE.horizonDisplayName,
    priceCents: COMMERCIAL_COMPTABLE.horizonDisplayPriceCents,
    tagline: COMMERCIAL_COMPTABLE.horizonTagline,
    recommended: true,
    features: [
      "Exclusivité totale sur la zone économique du cabinet.",
      "Profondeur de zone maximale — cartographie et capture intensives.",
      "0 % de commission sur vos honoraires signés.",
      `Garantie contractuelle : ${formatFoundationGuaranteeRdvLabel()} planifiés.`,
    ],
  },
] as const;

export const FOUNDATION_HORIZON_GUARANTEE_COPY =
  `${COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount} rendez-vous qualifiés garantis sur ${COMMERCIAL_COMPTABLE.horizonGuaranteeMonths} mois. Vous disposez de ${COMMERCIAL_COMPTABLE.horizonGuaranteeDays} jours pour tester le dispositif. Si les ${COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount} rendez-vous ne sont pas générés pendant votre abonnement, Hercule poursuit la prospection pendant ${COMMERCIAL_COMPTABLE.horizonGuaranteeDays} jours supplémentaires, sans frais, afin de compléter les rendez-vous restants.`;

export function foundationOfferLabel(
  offerType: OfferTypeComptable | string | null | undefined,
): string {
  if (offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    return `${COMMERCIAL_COMPTABLE.coreDisplayName} — ${formatFoundationEuros(COMMERCIAL_COMPTABLE.coreDisplayPriceCents)}/mois`;
  }
  if (
    offerType === OFFER_TYPES_COMPTABLE.monthly1499 ||
    offerType === OFFER_TYPES_COMPTABLE.monthly1499Trial
  ) {
    return `${COMMERCIAL_COMPTABLE.horizonDisplayName} — ${formatFoundationEuros(COMMERCIAL_COMPTABLE.horizonDisplayPriceCents)} / 1 mois`;
  }
  return `${COMMERCIAL_COMPTABLE.horizonDisplayName} — ${formatFoundationEuros(COMMERCIAL_COMPTABLE.horizonDisplayPriceCents)}/mois`;
}
