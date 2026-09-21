/**
 * SaaS autonome — capacity constants (30 inbox / client, 10 RDV bookés / mois).
 */

export const SAAS_CAPACITY = {
  inboxPerClient: 30,
  dailySendCapPerInbox: 30,
  rdvGoalMonthly: 10,
  /** Total sends (tap1 + tap2) per booked RDV */
  sendsPerBookedRdv: 1_000,
  /** Unique prospects touched per RDV (double tap = 2 sends) */
  uniqueProspectsPerRdv: 500,
  maxActiveClients: 10,
  /** Warmup days before inbox becomes active */
  warmupDays: 15,
  /** Cooloff after double tap with no reply */
  cooloffDays: 90,
  /** Hours between tap1 and tap2 */
  tap2DelayHours: 24,
  /** Monthly send budget per client (10 RDV × 1000 sends) */
  monthlySendBudget: 10_000,
  /** Alert when available pool per niche drops below */
  poolAlertThreshold: 50_000,
  /** Target available pool per niche at launch */
  poolTargetPerNiche: 70_000,
  sendDaysPerMonth: 26,
} as const;

export const SAAS_NICHES = ["restaurant", "sante", "btp"] as const;
export type SaasNiche = (typeof SAAS_NICHES)[number];

export const SAAS_OFFER_TYPE = "saas_autonome_10rdv" as const;

export const DEFAULT_NICHE_PREFERENCES: Record<SaasNiche, number> = {
  restaurant: 1,
  sante: 1,
  btp: 1,
};

/** Preset scraper IDs that feed each SaaS niche. */
export const SAAS_NICHE_PRESETS: Record<SaasNiche, readonly string[]> = {
  restaurant: ["restaurants_independants"],
  sante: ["chirurgiens_dentistes", "medecins_generalistes"],
  btp: ["btp_pme", "terrassement_vrd"],
};

export function currentMonthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function totalInboxFleet(): number {
  return SAAS_CAPACITY.maxActiveClients * SAAS_CAPACITY.inboxPerClient;
}
