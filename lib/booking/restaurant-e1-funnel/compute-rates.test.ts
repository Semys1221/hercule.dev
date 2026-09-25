import { describe, expect, it } from "vitest";

import {
  computeFunnelRates,
  formatRate,
} from "@/lib/booking/restaurant-e1-funnel/compute-rates";

describe("computeFunnelRates", () => {
  it("computes ratios when denominators are positive", () => {
    const rates = computeFunnelRates(100, 25, 5);
    expect(rates.clickRateFromEmails).toBe(0.25);
    expect(rates.bookingRateFromClicks).toBe(0.2);
    expect(rates.bookingRateFromEmails).toBe(0.05);
  });

  it("returns null rates when denominators are zero", () => {
    const rates = computeFunnelRates(0, 0, 0);
    expect(rates.clickRateFromEmails).toBeNull();
    expect(rates.bookingRateFromClicks).toBeNull();
    expect(rates.bookingRateFromEmails).toBeNull();
  });
});

describe("formatRate", () => {
  it("formats percentage", () => {
    expect(formatRate(0.256)).toBe("25.6 %");
  });

  it("returns dash for null", () => {
    expect(formatRate(null)).toBe("—");
  });
});
