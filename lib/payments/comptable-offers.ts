import {
  COMMERCIAL_COMPTABLE,
  OFFER_TYPES_COMPTABLE,
  type OfferTypeComptable,
} from "@/lib/commercial/constants";
import {
  COMPTABLE_ACQUISITION_OFFER_TYPE,
  priceIdForComptableAcquisition1489,
} from "@/lib/payments/comptable-acquisition-offers";
import type Stripe from "stripe";

import {
  getComptableMonthlyPriceId,
  getComptablePack3PriceId,
  getComptableStarterPriceId,
} from "@/lib/payments/stripe";

export function isComptableSubscriptionOffer(
  offerType: OfferTypeComptable,
): boolean {
  return (
    offerType === OFFER_TYPES_COMPTABLE.starter999_5 ||
    offerType === OFFER_TYPES_COMPTABLE.monthly1499 ||
    offerType === COMPTABLE_ACQUISITION_OFFER_TYPE
  );
}

export function comptableCheckoutMode(
  offerType: OfferTypeComptable,
): "subscription" | "payment" {
  return isComptableSubscriptionOffer(offerType) ? "subscription" : "payment";
}

/** Uses the live Stripe price type so one-time prices still checkout before recurring prices ship. */
export function stripeCheckoutModeForComptablePrice(
  price: Pick<Stripe.Price, "type">,
): "subscription" | "payment" {
  return price.type === "recurring" ? "subscription" : "payment";
}

export function priceIdForComptableOffer(offerType: OfferTypeComptable): string {
  if (offerType === OFFER_TYPES_COMPTABLE.pack3x1499) {
    return getComptablePack3PriceId();
  }
  if (offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    return getComptableStarterPriceId();
  }
  if (offerType === COMPTABLE_ACQUISITION_OFFER_TYPE) {
    return priceIdForComptableAcquisition1489();
  }
  return getComptableMonthlyPriceId();
}

export function amountCentsForComptableOffer(offerType: OfferTypeComptable): number {
  if (offerType === OFFER_TYPES_COMPTABLE.pack3x1499) {
    return COMMERCIAL_COMPTABLE.pack3TotalCents;
  }
  if (offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    return COMMERCIAL_COMPTABLE.starterPriceCents;
  }
  if (offerType === COMPTABLE_ACQUISITION_OFFER_TYPE) {
    return COMMERCIAL_COMPTABLE.acquisition1489PriceCents;
  }
  return COMMERCIAL_COMPTABLE.growthMonthlyPriceCents;
}
