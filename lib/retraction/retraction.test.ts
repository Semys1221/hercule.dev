import { describe, expect, it } from "vitest";

import { retractionAppliesTo } from "./applies";
import {
  addWorkingDays,
  computeRetractionEndsAt,
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
  it("returns 11 for pending and 7 otherwise", () => {
    expect(firstContratWorkingDays("pending")).toBe(11);
    expect(firstContratWorkingDays("waived")).toBe(7);
    expect(firstContratWorkingDays("expired")).toBe(7);
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

    expect(milestones[1]?.label).toBe("Premier RDV planifié");
    expect(milestones[1]?.estimatedAt).toMatch(/à/);
    expect(milestones[2]?.label).toBe("2ème mission attribuée");
    expect(milestones[3]?.label).toBe("3ème mission attribuée");
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

  it("shifts first contrat by 11 working days when pending", () => {
    const activation = new Date("2026-09-13T00:00:00.000Z");
    const first = addWorkingDays(activation, 11);
    const milestones = buildActivationMilestones({
      activationAt: activation,
      status: "pending",
    });

    expect(milestones[1]?.estimatedAt).toContain(String(first.getDate()));
  });
});
