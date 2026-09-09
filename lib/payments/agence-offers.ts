import {
  AGENCE_CHECKOUT_OFFER_TYPES,
  balanceCents,
  depositCents,
  OFFER_TYPES,
  PAYMENT_PHASES,
  totalPriceCentsForOffer,
  type AgenceCheckoutOfferType,
  type PaymentPhase,
} from "@/lib/commercial/constants";
import {
  getAgenceGrowthBalancePriceId,
  getAgenceGrowthDepositPriceId,
  getAgenceStarterBalancePriceId,
  getAgenceStarterDepositPriceId,
} from "@/lib/payments/stripe";

export { AGENCE_CHECKOUT_OFFER_TYPES, type AgenceCheckoutOfferType };

export function isAgenceCheckoutOfferType(
  value: string,
): value is AgenceCheckoutOfferType {
  return (AGENCE_CHECKOUT_OFFER_TYPES as readonly string[]).includes(value);
}

export function priceIdForAgenceOffer(
  offerType: AgenceCheckoutOfferType,
  phase: PaymentPhase,
): string {
  if (offerType === OFFER_TYPES.starter998_5) {
    return phase === PAYMENT_PHASES.balance
      ? getAgenceStarterBalancePriceId()
      : getAgenceStarterDepositPriceId();
  }
  return phase === PAYMENT_PHASES.balance
    ? getAgenceGrowthBalancePriceId()
    : getAgenceGrowthDepositPriceId();
}

export function amountCentsForAgenceOffer(
  offerType: AgenceCheckoutOfferType,
  phase: PaymentPhase,
): number {
  const total = totalPriceCentsForOffer(offerType);
  return phase === PAYMENT_PHASES.balance ? balanceCents(total) : depositCents(total);
}

export function buildCheckoutIntegrationIdentifier(suffix: string): string {
  return `agence_embed_${suffix}`;
}
