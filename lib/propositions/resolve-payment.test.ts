import { describe, expect, it } from "vitest";

import cabinetExemple from "@/content/propositions/cabinet-exemple.json";
import ludovic from "@/content/propositions/ludovic.json";
import { parsePropositionConfig } from "@/lib/propositions/schema";
import {
  getPricingOptions,
  resolveStripePaymentLinkUrl,
} from "@/lib/propositions/resolve-payment";

describe("resolveStripePaymentLinkUrl", () => {
  const cabinetConfig = parsePropositionConfig(cabinetExemple);
  const ludovicConfig = parsePropositionConfig(ludovic);

  it("falls back to payment.stripePaymentLinkUrl when no options", () => {
    expect(resolveStripePaymentLinkUrl(cabinetConfig, null)).toBe(
      cabinetConfig.payment.stripePaymentLinkUrl,
    );
  });

  it("uses selected pricing option URL when options exist", () => {
    const options = getPricingOptions(ludovicConfig);
    const growthOption = options?.find((option) => option.id === "formule-croissance-25");

    expect(growthOption).toBeDefined();
    expect(resolveStripePaymentLinkUrl(ludovicConfig, "formule-croissance-25")).toBe(
      growthOption?.stripePaymentLinkUrl,
    );
  });
});
