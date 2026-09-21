import { describe, expect, it } from "vitest";

import { retractionAppliesTo } from "./applies";
import { COMMERCIAL, COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import {
  addCalendarDays,
  addWorkingDays,
  comptableEstimatedFirstBookingAt,
  comptableFirstRdvRangeAt,
  computeRetractionEndsAt,
  estimatedFirstBookingAt,
  firstContratWorkingDays,
} from "./dates";
import { droitRetractationFromStatus, retractionDaysForStatus } from "./profile-sync";
import { resolveDashboardRetraction } from "./resolve";
import { buildActivationMilestones, buildComptableActivationMilestones } from "./timeline";

describe("retractionAppliesTo", () => {
  it("applies to agence and comptable only", () => {
    expect(retractionAppliesTo("agence")).toBe(true);
    expect(retractionAppliesTo("comptable")).toBe(true);
    expect(retractionAppliesTo("entreprise")).toBe(false);
  });
});

describe("computeRetractionEndsAt", () => {
  it("adds 4 calendar days", () => {
    const start = new Date("2026-09-09T12:00:00.000Z");
    const ends = computeRetractionEndsAt(start);
    expect(ends.getDate()).toBe(13);
  });
});

describe("firstContratWorkingDays", () => {
  it("returns 34/30 calendar days for 2x and 12/8 working days for Fast", () => {
    expect(firstContratWorkingDays("pending", false)).toBe(34);
    expect(firstContratWorkingDays("waived", false)).toBe(30);
    expect(firstContratWorkingDays("pending", true)).toBe(12);
    expect(firstContratWorkingDays("waived", true)).toBe(8);
  });
});

describe("profile sync polarity", () => {
  it("pending keeps droit_retractation true", () => {
    expect(droitRetractationFromStatus("pending")).toBe(true);
    expect(retractionDaysForStatus("pending")).toBe(4);
  });

  it("waived clears retraction days", () => {
    expect(droitRetractationFromStatus("waived")).toBe(false);
    expect(retractionDaysForStatus("waived")).toBe(0);
  });
});

describe("resolveDashboardRetraction", () => {
  it("allows waiver while pending and not in deliverance", () => {
    const result = resolveDashboardRetraction({
      category: "agence",
      row: {
        retraction_status: "pending",
        retraction_ends_at: "2099-01-01T00:00:00.000Z",
        onboarding_completed_at: "2026-09-09T00:00:00.000Z",
      },
      productStatut: "PAID_PENDING_ONBOARDING",
    });

    expect(result?.canWaive).toBe(true);
    expect(result?.status).toBe("pending");
  });

  it("blocks waiver after deliverance started", () => {
    const result = resolveDashboardRetraction({
      category: "agence",
      row: {
        retraction_status: "pending",
        retraction_ends_at: "2099-01-01T00:00:00.000Z",
        onboarding_completed_at: "2026-09-09T00:00:00.000Z",
      },
      productStatut: "IN_DELIVERANCE",
    });

    expect(result?.canWaive).toBe(false);
  });
});

describe("buildComptableActivationMilestones", () => {
  it("labels first RDV with 20–25 day range after activation", () => {
    const activation = new Date("2026-09-10T12:00:00.000Z");
    const milestones = buildComptableActivationMilestones({
      activationAt: activation,
      status: "waived",
      now: new Date("2026-09-09T00:00:00.000Z"),
    });

    expect(milestones[1]?.label).toBe("Premier RDV planifié (délai maximal)");
    expect(milestones[1]?.estimatedAt).toMatch(/à/);
    expect(milestones[2]?.label).toBe("2ème mission attribuée");
    expect(milestones[3]?.label).toBe("3ème mission attribuée");
  });

  it("shifts first RDV range when retraction is pending via delayed activation", () => {
    const onboardingComplete = new Date("2026-09-10T12:00:00.000Z");
    const activation = addCalendarDays(onboardingComplete, COMMERCIAL.retractationDays);
    const milestones = buildComptableActivationMilestones({
      activationAt: activation,
      status: "pending",
      now: onboardingComplete,
    });
    const range = comptableFirstRdvRangeAt(activation);

    expect(milestones[0]?.label).toBe("Activation prévue");
    expect(milestones[1]?.estimatedAt).toContain(String(range.min.getDate()));
    expect(milestones[1]?.estimatedAt).toContain(String(range.max.getDate()));
  });
});

describe("estimatedFirstBookingAt", () => {
  it("uses comptable SLA max (25 calendar days) after activation", () => {
    const activation = new Date("2026-09-10T12:00:00.000Z");
    const estimated = estimatedFirstBookingAt(activation, "waived", false, "comptable");
    expect(estimated.getTime()).toBe(comptableEstimatedFirstBookingAt(activation).getTime());
    expect(
      Math.round((estimated.getTime() - activation.getTime()) / (24 * 60 * 60 * 1000)),
    ).toBe(COMMERCIAL_COMPTABLE.firstRdvDaysMax);
  });

  it("keeps agence SLA for agence category", () => {
    const activation = new Date("2026-09-10T12:00:00.000Z");
    const estimated = estimatedFirstBookingAt(activation, "waived", false, "agence");
    expect(
      Math.round((estimated.getTime() - activation.getTime()) / (24 * 60 * 60 * 1000)),
    ).toBe(COMMERCIAL.agenceStandardFirstRdvCalendarDays);
  });
});

describe("buildActivationMilestones", () => {
  it("labels activation as pending when hold active", () => {
    const activation = new Date("2026-09-13T00:00:00.000Z");
    const milestones = buildActivationMilestones({
      activationAt: activation,
      status: "pending",
      now: new Date("2026-09-09T00:00:00.000Z"),
    });

    expect(milestones[0]?.label).toBe("Activation prévue");
    expect(milestones[0]?.status).toBe("active");
    expect(milestones[1]?.status).toBe("pending");
  });

  it("shifts first contrat by 34 calendar days when pending (paiement 2x)", () => {
    const activation = new Date("2026-09-13T00:00:00.000Z");
    const first = addCalendarDays(activation, 34);
    const milestones = buildActivationMilestones({
      activationAt: activation,
      status: "pending",
      isFastCheckout: false,
    });

    expect(milestones[1]?.estimatedAt).toContain(String(first.getDate()));
  });

  it("shifts first contrat by 8 working days when Fast checkout", () => {
    const activation = new Date("2026-09-10T12:00:00.000Z");
    const first = addWorkingDays(activation, 8);
    const milestones = buildActivationMilestones({
      activationAt: activation,
      status: "waived",
      isFastCheckout: true,
    });

    expect(milestones[1]?.estimatedAt).toContain(String(first.getDate()));
  });
});
