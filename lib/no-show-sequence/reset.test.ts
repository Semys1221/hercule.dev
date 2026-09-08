/** Unit tests for no-show reset guard. */

import assert from "node:assert/strict";

import { resetNoShowForLead } from "@/lib/no-show-sequence/reset";
import type { SalesCall } from "@/lib/sales-calls/types";

const baseSalesCall = {
  id: "00000000-0000-0000-0000-000000000001",
  agence_id: "00000000-0000-0000-0000-000000000002",
  entreprise_id: null,
  comptable_id: null,
  email: "test@example.com",
  calendly_invitee_uri: "https://api.calendly.com/scheduled_events/test/invitees/1",
  scheduled_at: new Date().toISOString(),
  notes: {},
  forecast_cents: null,
  created_at: new Date().toISOString(),
} satisfies Omit<SalesCall, "status">;

async function main() {
  const notNoShow = await resetNoShowForLead(
    { ...baseSalesCall, status: "scheduled" },
    baseSalesCall.agence_id!,
  );
  assert.equal(notNoShow.ok, false);
  if (!notNoShow.ok) {
    assert.equal(notNoShow.reason, "not_no_show");
  }

  const paid = await resetNoShowForLead(
    { ...baseSalesCall, status: "paid" },
    baseSalesCall.agence_id!,
  );
  assert.equal(paid.ok, false);
  if (!paid.ok) {
    assert.equal(paid.reason, "paid");
  }

  console.log("no-show-sequence/reset.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
