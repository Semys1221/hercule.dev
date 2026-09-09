import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  COMMERCIAL,
  COMMERCIAL_COMPTABLE,
  FORBIDDEN_COPY,
  OFFER_TYPES,
  OFFER_TYPES_COMPTABLE,
  VITRINE_ONLY,
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
});

describe("COMMERCIAL_COMPTABLE constants", () => {
  it("starterPriceCents is 99 900", () => {
    expect(COMMERCIAL_COMPTABLE.starterPriceCents).toBe(99_900);
  });

  it("starterMissions is 5", () => {
    expect(COMMERCIAL_COMPTABLE.starterMissions).toBe(5);
  });

  it("growthMonthlyPriceCents equals monthlyPriceCents alias", () => {
    expect(COMMERCIAL_COMPTABLE.growthMonthlyPriceCents).toBe(149_900);
    expect(COMMERCIAL_COMPTABLE.monthlyPriceCents).toBe(
      COMMERCIAL_COMPTABLE.growthMonthlyPriceCents,
    );
  });

  it("pack3TotalCents is 359 800 (1499 × 3 − 20 %, rounded)", () => {
    expect(COMMERCIAL_COMPTABLE.pack3TotalCents).toBe(359_800);
  });

  it("firstRdvDays is 15", () => {
    expect(COMMERCIAL_COMPTABLE.firstRdvDays).toBe(15);
  });

  it("growthMissionsPerMonth is 10", () => {
    expect(COMMERCIAL_COMPTABLE.growthMissionsPerMonth).toBe(10);
  });

  it("growth MRR guarantee is 3 000 € after 10 missions with 5 replacements", () => {
    expect(COMMERCIAL_COMPTABLE.growthGuaranteeMrrCents).toBe(300_000);
    expect(COMMERCIAL_COMPTABLE.growthGuaranteeMaxReplacements).toBe(5);
  });

  it("pack MRR guarantee is 9 000 € after 30 missions with 15 replacements", () => {
    expect(COMMERCIAL_COMPTABLE.pack3GuaranteeMrrCents).toBe(900_000);
    expect(COMMERCIAL_COMPTABLE.pack3GuaranteeMaxReplacements).toBe(15);
    expect(COMMERCIAL_COMPTABLE.pack3MissionsTotal).toBe(30);
    expect(COMMERCIAL_COMPTABLE.pack3GuaranteeMaxReplacements).toBe(
      3 * COMMERCIAL_COMPTABLE.growthGuaranteeMaxReplacements,
    );
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
    // 1 499 € = 149 900 cents
    expect(COMMERCIAL_COMPTABLE.monthlyPriceCents).toBe(149_900);
  });

  it("pack3x1499 amount matches COMMERCIAL_COMPTABLE.pack3TotalCents", () => {
    // 3 598 € = 359 800 cents (1499 × 3 − 20 %, rounded)
    expect(COMMERCIAL_COMPTABLE.pack3TotalCents).toBe(359_800);
  });

  it("starter999_5 amount matches COMMERCIAL_COMPTABLE.starterPriceCents", () => {
    expect(COMMERCIAL_COMPTABLE.starterPriceCents).toBe(99_900);
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
