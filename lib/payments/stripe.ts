import Stripe from "stripe";

import {
  getStripeSecretKey,
  getStripeStarterPriceId,
  getStripeWebhookSecret as getStripeWebhookSecretFromEnv,
} from "@/lib/env";

const STARTER_OFFER_TYPE = "starter_1489_5";

function requireEnv(value: string, name: string): string {
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getStripeClient(): Stripe {
  const secretKey = requireEnv(getStripeSecretKey(), "STRIPE_SECRET_KEY");
  return new Stripe(secretKey);
}

export function getStarterPriceId(): string {
  const priceId = getStripeStarterPriceId();
  return requireEnv(priceId, "STRIPE_PRICE_STARTER");
}

export function getStarterOfferType(): string {
  return STARTER_OFFER_TYPE;
}

export function getComptableMonthlyPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_MONTHLY?.trim();
  return requireEnv(priceId ?? "", "STRIPE_PRICE_COMPTABLE_MONTHLY");
}

export function getComptablePack3PriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_PACK3?.trim();
  return requireEnv(priceId ?? "", "STRIPE_PRICE_COMPTABLE_PACK3");
}

export function getStripeWebhookSecret(): string {
  return requireEnv(getStripeWebhookSecretFromEnv(), "STRIPE_WEBHOOK_SECRET");
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://www.hercule.dev"
  );
}
