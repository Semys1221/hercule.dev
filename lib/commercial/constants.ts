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
  pack3x1499: "pack_3x1499",
} as const;

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
  /** Hercule Lite — 998 €/mois, 5 missions/mois, aucune garantie MRR (offer type starter_999_5) */
  starterPriceCents: 99_800,
  liteMissionsPerMonth: 5,
  /** @deprecated Use liteMissionsPerMonth */
  starterMissions: 5,

  /** Hercule Starter — mensuel sans engagement — 1 499 €/mois, 10 missions (offer type monthly_1499) */
  growthMonthlyPriceCents: 149_900,
  /** Alias — même offre que growthMonthlyPriceCents */
  monthlyPriceCents: 149_900,
  growthMissionsPerMonth: 10,
  growthGuaranteeMrrCents: 300_000,
  growthGuaranteeMaxReplacements: 5,

  /** Pack 3 mois Starter — 1 499 € × 3 − 20 %, arrondi (offer type pack_3x1499) */
  pack3TotalCents: 359_800,
  pack3MissionsTotal: 30,
  pack3GuaranteeMrrCents: 900_000,
  pack3GuaranteeMaxReplacements: 15,

  billingCycleDays: 30,

  /** SLA premier RDV planifié (jours calendaires après activation) */
  firstRdvDaysMin: 20,
  firstRdvDaysMax: 25,

  /** MRR par lettre de mission signée (3 600 € honoraires annuels / 12) */
  mrrPerSignedMissionCents: 30_000,

  /** Vitrine marketing — honoraires annuels typiques d'une mission de tenue */
  valueShowcaseAnnualHonorairesCents: 360_000,
  valueShowcaseAnnualHonorairesLabel: "3 600 €",

  /** Plancher honoraires annuels lettre de mission (session + cards) */
  honorairesAnnuelsMinCents: 240_000,
  honorairesAnnuelsMinLabel: "2 400 €",

  /** Plafond vitrine honoraires annuels (fourchette marketing) */
  honorairesAnnuelsMaxVitrineCents: 600_000,
  honorairesAnnuelsMaxVitrineLabel: "6 000 €",

  /** Plancher honoraires mission ponctuelle (création, reprise, conseil) */
  honorairesPonctuelMinCents: 80_000,
  honorairesPonctuelMinLabel: "800 €",

  /** Seuil d'éligibilité cabinet */
  minAssociatesOrCollaborators: 3,

  /** No-show : recrédit + remplacement (aligné agence) */
  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,
} as const;
