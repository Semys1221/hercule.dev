/**
 * lib/commercial/constants.ts — Source of truth for all commercial values.
 *
 * Decisions: ENG-16, CPY-01, CPY-04, CAP-01, BIZ-10, BIZ-02.
 *
 * DO NOT duplicate these values in React components or email templates.
 * DO NOT parse cvg_master.md at runtime — read this module instead.
 * VITRINE_ONLY entries must never appear in payments.offer_type.
 */

export const COMMERCIAL = {
  /** Mensuel sans engagement — 1 489 €/mois */
  monthlyPriceCents: 148_900,

  /** Hercule Starter — 1 489 € one-shot, 5 attributions */
  starterAttributions: 5,
  starterFormulaLabel: "5 rendez-vous qualifiés",

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

  /** SLA volume honoré / mois @ allocation 30 inbox */
  volumeHonoredPerMonthStandard: { min: 3, max: 4 } as const,

  /** Accès onboarding après paiement */
  onboardingAccessHours: 48,

  /** Liste d'attente max */
  waitingListMaxDays: 15,
} as const;

/**
 * Offer types used in payments.offer_type — agence (Web/Tech) offers.
 * Must match CHECK constraint in Supabase migrations.
 */
export const OFFER_TYPES = {
  monthly1489: "monthly_1489",
  pack989x3: "pack_989x3",
} as const;

export type OfferType = (typeof OFFER_TYPES)[keyof typeof OFFER_TYPES];

/**
 * Offer types used in payments.offer_type — comptable offers.
 * Must match CHECK constraint in Supabase migrations (20261010120000_payments_comptable).
 */
export const OFFER_TYPES_COMPTABLE = {
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
  "4 jours",
  "MEETING_10",
] as const;

/**
 * Cabinets d'expertise comptable — separate commercial terms.
 * Stripe offer types: OFFER_TYPES_COMPTABLE (monthly_1499 / pack_3x1499).
 */
export const COMMERCIAL_COMPTABLE = {
  /** Mensuel sans engagement — 1 499 €/mois */
  monthlyPriceCents: 149_900,

  /** Pack 3 mois — 1 499 € × 3 − 20 %, arrondi */
  pack3TotalCents: 359_800,
  pack3BonusRdv: 5,

  /** Rythme opérationnel */
  missionsPerMonth: 5,
  billingCycleDays: 30,

  /** SLA livraison */
  firstRdvDays: 15,

  /** Garantie volume RDV (pas de garantie de signature) */
  guaranteeRdvCount: 15,
  guaranteeDays: 90,

  /** Vitrine marketing — honoraires annuels typiques d'une mission de tenue */
  valueShowcaseAnnualHonorairesCents: 360_000,
  valueShowcaseAnnualHonorairesLabel: "3 600 €",

  /** Seuil d'éligibilité cabinet */
  minAssociatesOrCollaborators: 3,

  /** No-show : recrédit + remplacement (aligné agence) */
  noshowReplaceWorkingDays: 14,
  honorMinutesMin: 15,
} as const;
