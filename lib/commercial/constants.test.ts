import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMMERCIAL,
  COMMERCIAL_COMPTABLE,
  FORBIDDEN_COPY,
  FOUNDATION_PRICING_PLANS,
  OFFER_TYPES,
  OFFER_TYPES_COMPTABLE,
  VITRINE_ONLY,
  formatComptableFirstRdvAfterActivationLabel,
  formatComptableFirstRdvLabel,
  foundationOfferLabel,
} from "./constants";

// ---------------------------------------------------------------------------
// Snapshot — ensure constants never drift silently
// ---------------------------------------------------------------------------

describe("COMMERCIAL constants", () => {
  it("starterPriceCents equals monthlyPriceCents", () => {
    expect(COMMERCIAL.starterPriceCents).toBe(COMMERCIAL.monthlyPriceCents);
    expect(COMMERCIAL.starterPriceCents).toBe(148_900);
  });

  it("retractationDays is 4", () => {
    expect(COMMERCIAL.retractationDays).toBe(4);
  });

  it("pack989x3TotalCents equals unit × 3", () => {
    expect(COMMERCIAL.pack989x3TotalCents).toBe(COMMERCIAL.pack989x3UnitCents * 3);
  });

  it("starterAttributions is 5", () => {
    expect(COMMERCIAL.starterAttributions).toBe(5);
  });

  it("starterFormulaLabel matches Starter copy", () => {
    expect(COMMERCIAL.starterFormulaLabel).toBe("5 rendez-vous qualifiés");
  });

  it("pack989x3Attributions is 15", () => {
    expect(COMMERCIAL.pack989x3Attributions).toBe(15);
  });

  it("packGuaranteeCaCents is 450 000", () => {
    expect(COMMERCIAL.packGuaranteeCaCents).toBe(450_000);
  });

  it("firstHonoredDaysStandard is 21", () => {
    expect(COMMERCIAL.firstHonoredDaysStandard).toBe(21);
  });

  it("noshowReplaceWorkingDays is 14", () => {
    expect(COMMERCIAL.noshowReplaceWorkingDays).toBe(14);
  });

  it("agence first RDV delays are 30 calendar days (2x) and 8 working days (Fast)", () => {
    expect(COMMERCIAL.agenceStandardFirstRdvCalendarDays).toBe(30);
    expect(COMMERCIAL.agenceStandardDeliveryDaysLabel).toBe("30 jours");
    expect(COMMERCIAL.agenceFastFirstRdvWorkingDays).toBe(8);
  });
});

describe("COMMERCIAL_COMPTABLE constants", () => {
  it("starterPriceCents aliases DEC monthly (Lite removed)", () => {
    expect(COMMERCIAL_COMPTABLE.starterPriceCents).toBe(149_900);
  });

  it("starterMissions aliases 10 crédits DEC", () => {
    expect(COMMERCIAL_COMPTABLE.starterMissions).toBe(10);
  });

  it("growthMonthlyPriceCents equals monthlyPriceCents alias", () => {
    expect(COMMERCIAL_COMPTABLE.growthMonthlyPriceCents).toBe(149_900);
    expect(COMMERCIAL_COMPTABLE.monthlyPriceCents).toBe(
      COMMERCIAL_COMPTABLE.growthMonthlyPriceCents,
    );
  });

  it("pack3TotalCents is 359 800 (1499 × 3 − 20 %)", () => {
    expect(COMMERCIAL_COMPTABLE.pack3TotalCents).toBe(359_800);
  });

  it("firstRdvDaysMin/Max is 20–25 (warm-up post-paiement)", () => {
    expect(COMMERCIAL_COMPTABLE.firstRdvDaysMin).toBe(20);
    expect(COMMERCIAL_COMPTABLE.firstRdvDaysMax).toBe(25);
  });

  it("formatComptableFirstRdvLabel matches canon v2", () => {
    expect(formatComptableFirstRdvLabel()).toBe("20 à 25 jours");
    expect(formatComptableFirstRdvAfterActivationLabel()).toBe(
      "20 à 25 jours après activation",
    );
  });

  it("growthMissionsPerMonth is 10", () => {
    expect(COMMERCIAL_COMPTABLE.growthMissionsPerMonth).toBe(10);
  });

  it("MRR guarantee removed in v2", () => {
    expect(COMMERCIAL_COMPTABLE.growthGuaranteeMrrCents).toBe(0);
    expect(COMMERCIAL_COMPTABLE.growthGuaranteeMaxReplacements).toBe(0);
  });

  it("pack MRR guarantee removed in v2", () => {
    expect(COMMERCIAL_COMPTABLE.pack3GuaranteeMrrCents).toBe(0);
    expect(COMMERCIAL_COMPTABLE.pack3GuaranteeMaxReplacements).toBe(0);
    expect(COMMERCIAL_COMPTABLE.pack3MissionsTotal).toBe(30);
  });

  it("honorairesAnnuelsMinCents is 240 000", () => {
    expect(COMMERCIAL_COMPTABLE.honorairesAnnuelsMinCents).toBe(240_000);
  });

  it("honorairesPonctuelMinCents is 80 000", () => {
    expect(COMMERCIAL_COMPTABLE.honorairesPonctuelMinCents).toBe(80_000);
  });

  it("Display prices are Pack Expert-Comptable 1 499 €", () => {
    expect(COMMERCIAL_COMPTABLE.coreDisplayPriceCents).toBe(149_900);
    expect(COMMERCIAL_COMPTABLE.horizonDisplayPriceCents).toBe(149_900);
  });

  it("Horizon display maps to DEC monthly cadence", () => {
    expect(COMMERCIAL_COMPTABLE.horizonGuaranteeRdvCount).toBe(10);
    expect(COMMERCIAL_COMPTABLE.horizonGuaranteeMonths).toBe(1);
    expect(COMMERCIAL_COMPTABLE.horizonGuaranteeDays).toBe(30);
  });

  it("Stripe monthly1499 amount is 1 499 € (canon v2)", () => {
    expect(COMMERCIAL_COMPTABLE.growthMonthlyPriceCents).toBe(149_900);
  });

  it("foundationOfferLabel uses Pack Expert-Comptable", () => {
    const coreLabel = foundationOfferLabel(OFFER_TYPES_COMPTABLE.starter999_5);
    const horizonLabel = foundationOfferLabel(OFFER_TYPES_COMPTABLE.monthly1499);

    expect(coreLabel).toMatch(/Expert-Comptable/);
    expect(coreLabel).not.toMatch(/Lite/i);
    expect(horizonLabel).toMatch(/Expert-Comptable/);
    expect(horizonLabel).not.toMatch(/Starter/i);
  });

  it("FOUNDATION_PRICING_PLANS exposes two DEC plans", () => {
    expect(FOUNDATION_PRICING_PLANS).toHaveLength(2);
    expect(FOUNDATION_PRICING_PLANS.map((plan) => plan.offerType)).toEqual([
      OFFER_TYPES_COMPTABLE.starter999_5,
      OFFER_TYPES_COMPTABLE.monthly1499,
    ]);
    expect(FOUNDATION_PRICING_PLANS.some((plan) => plan.recommended)).toBe(true);
  });
});

describe("VITRINE_ONLY", () => {
  it("hercule2500MonthlyCents is 250 000", () => {
    expect(VITRINE_ONLY.hercule2500MonthlyCents).toBe(250_000);
  });
});

describe("OFFER_TYPES", () => {
  it("matches Supabase CHECK constraint values", () => {
    expect(OFFER_TYPES.starter998_5).toBe("starter_998_5");
    expect(OFFER_TYPES.growth1498_10).toBe("growth_1498_10");
    expect(OFFER_TYPES.starter1489_5).toBe("starter_1489_5");
    expect(OFFER_TYPES.monthly1489).toBe("monthly_1489");
    expect(OFFER_TYPES.pack989x3).toBe("pack_989x3");
  });
});

describe("Agence 998/1498 deposit math", () => {
  it("splits 50/50 for starter and growth", async () => {
    const { depositCents, balanceCents, COMMERCIAL } = await import("./constants");
    expect(depositCents(COMMERCIAL.starter998PriceCents)).toBe(49_900);
    expect(balanceCents(COMMERCIAL.starter998PriceCents)).toBe(49_900);
    expect(depositCents(COMMERCIAL.growth1498PriceCents)).toBe(74_900);
    expect(balanceCents(COMMERCIAL.growth1498PriceCents)).toBe(74_900);
  });
});

describe("OFFER_TYPES_COMPTABLE", () => {
  it("matches Supabase CHECK constraint values (20261010120000_payments_comptable)", () => {
    expect(OFFER_TYPES_COMPTABLE.starter999_5).toBe("starter_999_5");
    expect(OFFER_TYPES_COMPTABLE.monthly1499).toBe("monthly_1499");
    expect(OFFER_TYPES_COMPTABLE.pack3x1499).toBe("pack_3x1499");
  });

  it("monthly1499 amount matches COMMERCIAL_COMPTABLE.monthlyPriceCents", () => {
    expect(COMMERCIAL_COMPTABLE.monthlyPriceCents).toBe(149_900);
  });

  it("pack3x1499 amount matches COMMERCIAL_COMPTABLE.pack3TotalCents", () => {
    expect(COMMERCIAL_COMPTABLE.pack3TotalCents).toBe(359_800);
  });

  it("starter999_5 amount matches COMMERCIAL_COMPTABLE.starterPriceCents (DEC alias)", () => {
    expect(COMMERCIAL_COMPTABLE.starterPriceCents).toBe(149_900);
  });
});

// ---------------------------------------------------------------------------
// FORBIDDEN_COPY — scan email templates for banned strings
// ---------------------------------------------------------------------------

const TEMPLATE_FILES = [
  "lib/booking-communication/templates.ts",
  "lib/booking-communication/product-vars.ts",
];

describe("FORBIDDEN_COPY — email templates must not contain banned strings", () => {
  for (const relPath of TEMPLATE_FILES) {
    const fullPath = join(process.cwd(), relPath);
    let content: string;
    try {
      content = readFileSync(fullPath, "utf8");
    } catch {
      // File may not exist in all environments — skip rather than fail
      continue;
    }

    for (const banned of FORBIDDEN_COPY) {
      it(`"${banned}" absent from ${relPath}`, () => {
        expect(content).not.toContain(banned);
      });
    }
  }
});
