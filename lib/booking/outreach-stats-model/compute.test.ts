import { describe, expect, it } from "vitest";

import {
  daysToSendVolume,
  emailsForTargetRdv,
  positiveResponseRate,
  rdvFromEmails,
} from "@/lib/booking/outreach-stats-model/compute";

describe("outreach stats model (restaurant baseline)", () => {
  const emailsRef = 3000;
  const positivesRef = 13;
  const bookingRate = 0.2;
  const rate = positiveResponseRate(emailsRef, positivesRef);

  it("matches 0.433% positive response rate", () => {
    expect(rate).toBeCloseTo(13 / 3000, 6);
  });

  it("projects ~2.6 RDV at 3000 emails and 20% booking", () => {
    expect(rdvFromEmails(3000, rate, bookingRate)).toBeCloseTo(2.6, 1);
  });

  it("needs ~11538 emails for 10 RDV at 20% booking", () => {
    const needed = emailsForTargetRdv(10, rate, bookingRate);
    expect(needed).toBeCloseTo(11538.46, 0);
  });

  it("needs ~6.4 days at 1800 emails/day for 10 RDV", () => {
    const needed = emailsForTargetRdv(10, rate, bookingRate);
    expect(daysToSendVolume(needed, 1800)).toBeCloseTo(6.41, 1);
  });
});
