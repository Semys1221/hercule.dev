import Stripe from "stripe";

const STARTER_OFFER_TYPE = "starter_1489_5";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(secretKey);
}

export function getStarterPriceId(): string {
  const priceId =
    process.env.STRIPE_PRICE_STARTER?.trim() ||
    process.env.STRIPE_PRICE_MONTHLY_1489?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_STARTER is not set");
  }
  return priceId;
}

export function getStarterOfferType(): string {
  return STARTER_OFFER_TYPE;
}

export function getComptableMonthlyPriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_MONTHLY?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_COMPTABLE_MONTHLY is not set");
  }
  return priceId;
}

export function getComptablePack3PriceId(): string {
  const priceId = process.env.STRIPE_PRICE_COMPTABLE_PACK3?.trim();
  if (!priceId) {
    throw new Error("STRIPE_PRICE_COMPTABLE_PACK3 is not set");
  }
  return priceId;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://www.hercule.dev"
  );
}
