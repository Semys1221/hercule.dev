import { COMPTABLE_ACQUISITION_1489 } from "@/lib/commercial/constants";
import type Stripe from "stripe";

import { getComptableAcquisition1489PriceId } from "@/lib/payments/stripe";

export const COMPTABLE_ACQUISITION_PRODUCT_NAME = COMPTABLE_ACQUISITION_1489.productName;
export const COMPTABLE_ACQUISITION_OFFER_TYPE = COMPTABLE_ACQUISITION_1489.offerType;
export const COMPTABLE_ACQUISITION_MONTHLY_CENTS = COMPTABLE_ACQUISITION_1489.monthlyPriceCents;

export const COMPTABLE_ACQUISITION_STRIPE_LOOKUP_KEY =
  "comptable_acquisition_1489_monthly";

/** Stripe Payment Link metadata.product — identifies buy.stripe.com link. */
export const COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_METADATA_PRODUCT =
  "comptable_acquisition_1489";

/**
 * Default Payment Link URL (provision via scripts/crm/provisionComptableAcquisition1489Stripe.ts).
 * Override with STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489 in production.
 */
export const COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_URL =
  "https://buy.stripe.com/3cI3cuewZe9D0mXgAE3Je0m";

export function paymentLinkUrlForComptableAcquisition1489(): string {
  const fromEnv = process.env.STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_URL) {
    return COMPTABLE_ACQUISITION_STRIPE_PAYMENT_LINK_URL;
  }
  throw new Error(
    "STRIPE_PAYMENT_LINK_COMPTABLE_ACQUISITION_1489 is not set — run provisionComptableAcquisition1489Stripe.ts",
  );
}

export function priceIdForComptableAcquisition1489(): string {
  return getComptableAcquisition1489PriceId();
}

export function amountCentsForComptableAcquisition1489(): number {
  return COMPTABLE_ACQUISITION_MONTHLY_CENTS;
}

export function assertComptableAcquisitionStripePrice(price: Stripe.Price): void {
  if (price.type !== "recurring") {
    throw new Error("Comptable acquisition price must be recurring (subscription)");
  }
  const amount = price.unit_amount ?? 0;
  if (amount !== COMPTABLE_ACQUISITION_MONTHLY_CENTS) {
    throw new Error(
      `Comptable acquisition Stripe price amount mismatch: expected ${COMPTABLE_ACQUISITION_MONTHLY_CENTS}, got ${amount}`,
    );
  }
}
