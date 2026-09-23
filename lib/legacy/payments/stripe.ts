import Stripe from "stripe";

import { LEGAL_ENTITY } from "@/lib/constants";
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
 * @deprecated Canon v3 — these prices are archived (active:false) in live Stripe.
 * Lookup keys: agence_starter_998_{deposit|balance}, agence_growth_1498_{deposit|balance}.
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

/**
 * Stripe price IDs — Hercule Mercantile (DEC) + legacy comptable archived prices.
 * Canon v3: product « Hercule Mercantile » · price trial `comptable_dec_1499_trial_14d`.
 * Lite / Starter 2199 / Pack3 archived live (active:false) 2026-09-20.
 */
const COMPTABLE_STRIPE_PRICE_IDS = {
  /** @deprecated archived — Lite 1 799 */
  liteMonthly: "price_1UFE8oBd01AMeiaQV6PauMkI",
  /** @deprecated archived — Starter 2 199 */
  starterMonthly: "price_1UFE8rBd01AMeiaQcfNXx6kC",
  /** Hercule Mercantile — 1 499 €/mois after trial_period_days=14 */
  monthly1499Trial: "price_1UHm2oBd01AMeiaQTHRKPwrj",
  /** @deprecated archived — Pack 3 mois 5 277,60 */
  pack3: "price_1UFE8sBd01AMeiaQjwDBB5Ry",
} as const;

/**
 * Hercule Hubris (IAS + CIF) — live Stripe product `prod_VINFYw0GP6Vlbb`.
 * Override via STRIPE_PRICE_HERCULE_HUBRIS_FLAT / STRIPE_PRICE_HERCULE_HUBRIS_MONTHLY.
 */
const HERCULE_HUBRIS_STRIPE_PRICE_IDS = {
  optionAFlat: "price_1UHmVWBd01AMeiaQGmTPMCet",
  optionBMonthly: "price_1UHmVXBd01AMeiaQKfS96ekn",
} as const;

export function getHerculeHubrisOptionAPriceId(): string {
  return (
    process.env.STRIPE_PRICE_HERCULE_HUBRIS_FLAT?.trim() ||
    HERCULE_HUBRIS_STRIPE_PRICE_IDS.optionAFlat
  );
}

export function getHerculeHubrisOptionBPriceId(): string {
  return (
    process.env.STRIPE_PRICE_HERCULE_HUBRIS_MONTHLY?.trim() ||
    HERCULE_HUBRIS_STRIPE_PRICE_IDS.optionBMonthly
  );
}

/** @deprecated Hercule Libéral — price archived live 2026-09-20. Override via STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY. */
const HERCULE_LIBERAL_STRIPE_PRICE_ID = "price_1UFzzcBd01AMeiaQfIcIAPHG";

export function getHerculeLiberalPriceId(): string {
  const fromEnv = process.env.STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (HERCULE_LIBERAL_STRIPE_PRICE_ID) {
    return HERCULE_LIBERAL_STRIPE_PRICE_ID;
  }
  throw new Error("STRIPE_PRICE_HERCULE_LIBERAL_MONTHLY is not set");
}

const COMPTABLE_ACQUISITION_STRIPE_PRICE_ID = "price_1UGFljBd01AMeiaQ1L4qF4IM";

/** Comptable Acquisition — 1 489 €/mois (Payment Link closer). */
export function getComptableAcquisition1489PriceId(): string {
  const fromEnv = process.env.STRIPE_PRICE_COMPTABLE_ACQUISITION_1489?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (COMPTABLE_ACQUISITION_STRIPE_PRICE_ID) {
    return COMPTABLE_ACQUISITION_STRIPE_PRICE_ID;
  }
  throw new Error(
    "STRIPE_PRICE_COMPTABLE_ACQUISITION_1489 is not set — run provisionComptableAcquisition1489Stripe.ts",
  );
}

/** Hercule Starter — 2 199 €/mois (recurring). */
export function getComptableMonthlyPriceId(): string {
  return (
    process.env.STRIPE_PRICE_COMPTABLE_MONTHLY?.trim() ||
    COMPTABLE_STRIPE_PRICE_IDS.starterMonthly
  );
}

/** DEC free trial — 1 499 €/mois after 14-day trial (Checkout trial_period_days). */
export function getComptableMonthlyTrialPriceId(): string {
  return (
    process.env.STRIPE_PRICE_COMPTABLE_MONTHLY_TRIAL?.trim() ||
    COMPTABLE_STRIPE_PRICE_IDS.monthly1499Trial
  );
}

export function getComptablePack3PriceId(): string {
  return (
    process.env.STRIPE_PRICE_COMPTABLE_PACK3?.trim() || COMPTABLE_STRIPE_PRICE_IDS.pack3
  );
}

/** Hercule Lite — 1 799 €/mois (recurring). */
export function getComptableStarterPriceId(): string {
  return (
    process.env.STRIPE_PRICE_COMPTABLE_STARTER?.trim() ||
    COMPTABLE_STRIPE_PRICE_IDS.liteMonthly
  );
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

/**
 * Conférence — live Stripe prices (lookup keys conference_*).
 * Provisioned 2026-09-21 via Stripe MCP.
 */
const CONFERENCE_STRIPE_PRICE_IDS = {
  decMonthly: "price_1UI7LMBd01AMeiaQn4CjBx5w",
  decPack: "price_1UI7LMBd01AMeiaQGEyByfJU",
  courtageMonthly: "price_1UI7LMBd01AMeiaQR1GrXhIW",
  courtagePack: "price_1UI7LMBd01AMeiaQXWdKcbyY",
} as const;

export function getConferenceDecMonthlyPriceId(): string {
  return (
    process.env.STRIPE_PRICE_CONFERENCE_DEC_MONTHLY?.trim() ||
    CONFERENCE_STRIPE_PRICE_IDS.decMonthly
  );
}

export function getConferenceDecPackPriceId(): string {
  return (
    process.env.STRIPE_PRICE_CONFERENCE_DEC_PACK?.trim() ||
    CONFERENCE_STRIPE_PRICE_IDS.decPack
  );
}

export function getConferenceCourtageMonthlyPriceId(): string {
  return (
    process.env.STRIPE_PRICE_CONFERENCE_COURTAGE_MONTHLY?.trim() ||
    CONFERENCE_STRIPE_PRICE_IDS.courtageMonthly
  );
}

export function getConferenceCourtagePackPriceId(): string {
  return (
    process.env.STRIPE_PRICE_CONFERENCE_COURTAGE_PACK?.trim() ||
    CONFERENCE_STRIPE_PRICE_IDS.courtagePack
  );
}

/** Matches `.conference { --background }` in app/globals.css — proposition / conférence marketing. */
export const CONFERENCE_SURFACE_BACKGROUND = "#f4f1eb";

/** Overrides legacy account business_profile.name (e.g. Montis Media) on embedded Checkout. */
export function getCheckoutBrandingSettings(): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  return {
    display_name: LEGAL_ENTITY.commercialName,
    background_color: "#fffcf8",
    button_color: "#1a1a1a",
  };
}

/** Embedded checkout on `.conference` pages — same background as the page, not card ivory. */
export function getConferenceCheckoutBrandingSettings(): Stripe.Checkout.SessionCreateParams.BrandingSettings {
  return {
    display_name: LEGAL_ENTITY.commercialName,
    background_color: CONFERENCE_SURFACE_BACKGROUND,
    button_color: "#1a1a1a",
  };
}
