import { describe, expect, it, vi, afterEach } from "vitest";

import { OFFER_TYPES, PAYMENT_PHASES } from "@/lib/commercial/constants";

vi.mock("@/lib/payments/stripe", () => ({
  getAgenceStarterDepositPriceId: () => "price_starter_deposit",
  getAgenceStarterBalancePriceId: () => "price_starter_balance",
  getAgenceGrowthDepositPriceId: () => "price_growth_deposit",
  getAgenceGrowthBalancePriceId: () => "price_growth_balance",
}));

import {
  amountCentsForAgenceOffer,
  isAgenceCheckoutOfferType,
  priceIdForAgenceOffer,
} from "./agence-offers";

describe("isAgenceCheckoutOfferType", () => {
  it("accepts starter and growth offer types", () => {
    expect(isAgenceCheckoutOfferType(OFFER_TYPES.starter998_5)).toBe(true);
    expect(isAgenceCheckoutOfferType(OFFER_TYPES.growth1498_10)).toBe(true);
  });

  it("rejects legacy and unknown offer types", () => {
    expect(isAgenceCheckoutOfferType(OFFER_TYPES.starter1489_5)).toBe(false);
    expect(isAgenceCheckoutOfferType("unknown")).toBe(false);
  });
});

describe("amountCentsForAgenceOffer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 50% deposit amounts", () => {
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.starter998_5, PAYMENT_PHASES.deposit),
    ).toBe(49_900);
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.growth1498_10, PAYMENT_PHASES.deposit),
    ).toBe(74_900);
  });

  it("returns 50% balance amounts", () => {
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.starter998_5, PAYMENT_PHASES.balance),
    ).toBe(49_900);
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.growth1498_10, PAYMENT_PHASES.balance),
    ).toBe(74_900);
  });
});

describe("priceIdForAgenceOffer", () => {
  it("maps offer type and phase to Stripe price IDs", () => {
    expect(
      priceIdForAgenceOffer(OFFER_TYPES.starter998_5, PAYMENT_PHASES.deposit),
    ).toBe("price_starter_deposit");
    expect(
      priceIdForAgenceOffer(OFFER_TYPES.starter998_5, PAYMENT_PHASES.balance),
    ).toBe("price_starter_balance");
    expect(
      priceIdForAgenceOffer(OFFER_TYPES.growth1498_10, PAYMENT_PHASES.deposit),
    ).toBe("price_growth_deposit");
    expect(
      priceIdForAgenceOffer(OFFER_TYPES.growth1498_10, PAYMENT_PHASES.balance),
    ).toBe("price_growth_balance");
  });
});
