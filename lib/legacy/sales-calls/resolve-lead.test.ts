import assert from "node:assert/strict";

import { resolveSalesCallLead, upsertIdsForLeadCategory } from "./resolve-lead";
import type { SalesCall } from "./types";

function baseSalesCall(overrides: Partial<SalesCall> = {}): SalesCall {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    agence_id: null,
    entreprise_id: null,
    comptable_id: null,
    cif_id: null,
    email: "test@example.com",
    calendly_invitee_uri: "https://api.calendly.com/invitees/x",
    scheduled_at: null,
    status: "scheduled",
    notes: {},
    forecast_cents: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

assert.deepEqual(
  resolveSalesCallLead(
    baseSalesCall({ comptable_id: "cccccccc-cccc-cccc-cccc-cccccccccccc" }),
  ),
  { leadId: "cccccccc-cccc-cccc-cccc-cccccccccccc", category: "comptable" },
);

assert.deepEqual(upsertIdsForLeadCategory("comptable", "cccccccc-cccc-cccc-cccc-cccccccccccc"), {
  comptableId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
});

console.log("resolve-lead.test.ts OK");
