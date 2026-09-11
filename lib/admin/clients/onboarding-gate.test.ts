/** Unit tests for Clients onboarding gate (Phase 5 §7.1). */

import assert from "node:assert/strict";

import {
  CLIENTS_ONBOARDING_GATE_TABLES,
  filterOnboardedRows,
} from "@/lib/admin/clients/onboarding-gate";

assert.deepEqual(CLIENTS_ONBOARDING_GATE_TABLES, ["agence", "comptable", "entreprise", "cif"]);

const rows = [
  { id: "1", onboarding_completed_at: "2026-01-01T00:00:00.000Z" },
  { id: "2", onboarding_completed_at: null },
  { id: "3", onboarding_completed_at: "2026-02-01T00:00:00.000Z" },
];

assert.equal(filterOnboardedRows(rows, false).length, 2);
assert.equal(filterOnboardedRows(rows, true).length, 3);
assert.ok(
  filterOnboardedRows(rows, false).every((row) => row.onboarding_completed_at != null),
);

console.log("onboarding-gate.test.ts: ok");
