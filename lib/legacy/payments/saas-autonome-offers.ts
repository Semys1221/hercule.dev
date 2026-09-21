/**
 * SaaS autonome — offer type + pricing helpers.
 * 10 RDV bookés / mois @ 30 inbox — price placeholder until commercial lock.
 */

import { SAAS_CAPACITY, SAAS_OFFER_TYPE } from "@/lib/legacy/capacity/constants";

/** Placeholder monthly price — override via STRIPE_PRICE_SAAS_AUTONOME env. */
export const SAAS_AUTONOME = {
  productName: "Hercule SaaS Autonome",
  offerType: SAAS_OFFER_TYPE,
  /** Cents — 1 498 €/mois placeholder (align Growth until Offres DB locks) */
  monthlyPriceCents: 149_800,
  rdvGoalMonthly: SAAS_CAPACITY.rdvGoalMonthly,
  inboxAllocation: SAAS_CAPACITY.inboxPerClient,
  metadataProduct: "saas_autonome",
} as const;

export function getSaasAutonomePriceId(): string {
  return (
    process.env.STRIPE_PRICE_SAAS_AUTONOME?.trim() ||
    process.env.STRIPE_PRICE_AGENCE_GROWTH_DEPOSIT?.trim() ||
    ""
  );
}

export function isSaasAutonomeOfferType(offerType: string): boolean {
  return offerType === SAAS_OFFER_TYPE;
}
