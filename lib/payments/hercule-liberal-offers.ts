import { HERCULE_LIBERAL } from "@/lib/commercial/constants";
import type Stripe from "stripe";

import { getHerculeLiberalPriceId } from "@/lib/payments/stripe";

export const HERCULE_LIBERAL_PRODUCT_NAME = HERCULE_LIBERAL.productName;
export const HERCULE_LIBERAL_OFFER_TYPE = HERCULE_LIBERAL.offerType;
export const HERCULE_LIBERAL_MONTHLY_CENTS = HERCULE_LIBERAL.monthlyPriceCents;

export const HERCULE_LIBERAL_STRIPE_LOOKUP_KEY = "hercule_liberal_1200_monthly";

/** Stripe Payment Link metadata.product — identifies the reusable buy.stripe.com link. */
export const HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_METADATA_PRODUCT = "hercule_liberal";

/**
 * Default Payment Link URL (provision via scripts/crm/provisionHerculeLiberalStripe.ts).
 * Override with STRIPE_PAYMENT_LINK_HERCULE_LIBERAL in production.
 */
export const HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL =
  "https://buy.stripe.com/cNi3cubkN3uZ0mX4RW3Je0l";

export function paymentLinkUrlForHerculeLiberal(): string {
  const fromEnv = process.env.STRIPE_PAYMENT_LINK_HERCULE_LIBERAL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL) {
    return HERCULE_LIBERAL_STRIPE_PAYMENT_LINK_URL;
  }
  throw new Error(
    "STRIPE_PAYMENT_LINK_HERCULE_LIBERAL is not set — run provisionHerculeLiberalStripe.ts",
  );
}

export function priceIdForHerculeLiberal(): string {
  return getHerculeLiberalPriceId();
}

export function amountCentsForHerculeLiberal(): number {
  return HERCULE_LIBERAL_MONTHLY_CENTS;
}

export function assertHerculeLiberalStripePrice(price: Stripe.Price): void {
  if (price.type !== "recurring") {
    throw new Error("Hercule Libéral price must be recurring (subscription)");
  }
  const amount = price.unit_amount ?? 0;
  if (amount !== HERCULE_LIBERAL_MONTHLY_CENTS) {
    throw new Error(
      `Hercule Libéral Stripe price amount mismatch: expected ${HERCULE_LIBERAL_MONTHLY_CENTS}, got ${amount}`,
    );
  }
}
