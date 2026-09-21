import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeCapacitySla,
  estimateActivationAt,
} from "@/lib/legacy/capacity/compute-sla";
import { SAAS_CAPACITY } from "@/lib/legacy/capacity/constants";

describe("computeCapacitySla", () => {
  it("reports progress against monthly RDV goal", () => {
    const sla = computeCapacitySla({
      inbox_allocation: 30,
      rdv_goal_monthly: 10,
      capacity_status: "active",
      estimated_activation_at: null,
      activated_at: "2026-09-01T00:00:00.000Z",
      rdv_booked_this_month: 4,
      rdv_month_key: "2099-01", // force mismatch → 0 booked unless we pass matching key
      sends_this_month: 0,
      sends_month_key: null,
    });
    assert.equal(sla.inboxAllocation, 30);
    assert.equal(sla.rdvGoalMonthly, 10);
    assert.equal(sla.phase, "active");
  });

  it("counts booked RDV when month key matches", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    const sla = computeCapacitySla(
      {
        inbox_allocation: SAAS_CAPACITY.inboxPerClient,
        rdv_goal_monthly: 10,
        capacity_status: "active",
        estimated_activation_at: null,
        activated_at: now.toISOString(),
        rdv_booked_this_month: 3,
        rdv_month_key: "2026-09",
        sends_this_month: 2000,
        sends_month_key: "2026-09",
      },
      now,
    );
    assert.equal(sla.rdvBookedThisMonth, 3);
    assert.equal(sla.progressPct, 30);
    assert.equal(sla.sendsThisMonth, 2000);
  });
});

describe("estimateActivationAt", () => {
  it("adds warmup days for first in queue", () => {
    const from = new Date("2026-09-01T00:00:00.000Z");
    const result = estimateActivationAt(1, 15, from);
    assert.equal(result.toISOString().slice(0, 10), "2026-09-16");
  });
});
