import assert from "node:assert/strict";

import { buildComptableNotPaidMilestones } from "./comptable-not-paid-milestones";

const now = new Date("2026-09-11T12:00:00.000Z");
const steps = buildComptableNotPaidMilestones(now);

assert.equal(steps[0]?.id, "payment");
assert.equal(steps[0]?.status, "active");
assert.equal(steps[0]?.label, "Finalisation du paiement");
assert.ok(steps.length > 1);
assert.equal(steps[1]?.status, "pending");

console.log("comptable-not-paid-milestones.test.ts OK");
