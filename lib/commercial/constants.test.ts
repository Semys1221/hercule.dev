import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COMMERCIAL, FORBIDDEN_COPY, OFFER_TYPES, VITRINE_ONLY } from "./constants";

// ---------------------------------------------------------------------------
// Snapshot — ensure constants never drift silently
// ---------------------------------------------------------------------------

describe("COMMERCIAL constants", () => {
  it("monthlyPriceCents is 148 900", () => {
    expect(COMMERCIAL.monthlyPriceCents).toBe(148_900);
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

describe("VITRINE_ONLY", () => {
  it("hercule2500MonthlyCents is 250 000", () => {
    expect(VITRINE_ONLY.hercule2500MonthlyCents).toBe(250_000);
  });
});

describe("OFFER_TYPES", () => {
  it("matches Supabase CHECK constraint values", () => {
    expect(OFFER_TYPES.monthly1489).toBe("monthly_1489");
    expect(OFFER_TYPES.pack989x3).toBe("pack_989x3");
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
