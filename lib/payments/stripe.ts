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

/** @deprecated Legacy 1 489 € Starter — use agence deposit price getters for new checkouts. */
export function getStarterPriceId(): string {
  const priceId = getStripeStarterPriceId();
  return requireEnv(priceId, "STRIPE_PRICE_STARTER");
}

export function getStarterOfferType(): string {
  return STARTER_OFFER_TYPE;
}

/**
 * Canonical Stripe price IDs for agence 50/50 checkout.
 * Lookup keys: agence_starter_998_{deposit|balance}, agence_growth_1498_{deposit|balance}.
 * Env vars override these defaults (see doc/tech-stack/modules/payments-stripe.md).
 */
const AGENCE_STRIPE_PRICE_IDS = {
  starterDeposit: "price_1UDf2wBd01AMeiaQvafqpUoc",
  starterBalance: "price_1UDf2wBd01AMeiaQXMsGzVQK",
  growthDeposit: "price_1UDf2wBd01AMeiaQQP36mSak",
  growthBalance: "price_1UDf2wBd01AMeiaQkdAlLNZd",
} as const;

export function getAgenceStarterDepositPriceId(): string {
  return (
    process.env.STRIPE_PRICE_AGENCE_STARTER_DEPOSIT?.trim() ||
    AGENCE_STRIPE_PRICE_IDS.starterDeposit
  );
}

export function getAgenceStarterBalancePriceId(): string {
  return (
    process.env.STRIPE_PRICE_AGENCE_STARTER_BALANCE?.trim() ||
    AGENCE_STRIPE_PRICE_IDS.starterBalance
  );
}

export function getAgenceGrowthDepositPriceId(): string {
  return (
    process.env.STRIPE_PRICE_AGENCE_GROWTH_DEPOSIT?.trim() ||
    AGENCE_STRIPE_PRICE_IDS.growthDeposit
  );
}

export function getAgenceGrowthBalancePriceId(): string {
  return (
    process.env.STRIPE_PRICE_AGENCE_GROWTH_BALANCE?.trim() ||
    AGENCE_STRIPE_PRICE_IDS.growthBalance
  );
}

export function getComptableMonthlyPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_MONTHLY?.trim();
  return requireEnv(priceId ?? "", "STRIPE_PRICE_COMPTABLE_MONTHLY");
}

export function getComptablePack3PriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_PACK3?.trim();
  return requireEnv(priceId ?? "", "STRIPE_PRICE_COMPTABLE_PACK3");
}

export function getComptableStarterPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_STARTER?.trim();
  return requireEnv(priceId ?? "", "STRIPE_PRICE_COMPTABLE_STARTER");
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
