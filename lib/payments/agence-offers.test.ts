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
  lineItemsForAgenceCheckout,
  paymentPhaseForAgenceCheckout,
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

  it("returns full amounts for Fast checkout", () => {
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.starter998_5, PAYMENT_PHASES.full),
    ).toBe(99_800);
    expect(
      amountCentsForAgenceOffer(OFFER_TYPES.growth1498_10, PAYMENT_PHASES.full),
    ).toBe(149_800);
  });
});

describe("lineItemsForAgenceCheckout", () => {
  it("returns deposit only by default", () => {
    expect(lineItemsForAgenceCheckout(OFFER_TYPES.starter998_5, false)).toEqual([
      { price: "price_starter_deposit", quantity: 1 },
    ]);
  });

  it("returns deposit and balance for Fast", () => {
    expect(lineItemsForAgenceCheckout(OFFER_TYPES.starter998_5, true)).toEqual([
      { price: "price_starter_deposit", quantity: 1 },
      { price: "price_starter_balance", quantity: 1 },
    ]);
  });
});

describe("paymentPhaseForAgenceCheckout", () => {
  it("maps Fast to full phase", () => {
    expect(paymentPhaseForAgenceCheckout(true)).toBe(PAYMENT_PHASES.full);
    expect(paymentPhaseForAgenceCheckout(false)).toBe(PAYMENT_PHASES.deposit);
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
