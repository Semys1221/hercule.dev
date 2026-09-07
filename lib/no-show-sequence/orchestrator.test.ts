/** Unit tests for no-show sequence orchestrator. */

import assert from "node:assert/strict";

import { startNoShowSequence } from "@/lib/no-show-sequence/orchestrator";
import type { SalesCall } from "@/lib/sales-calls/types";

const baseSalesCall = {
  id: "00000000-0000-0000-0000-000000000001",
  agence_id: null,
  email: "test@example.com",
  calendly_invitee_uri: "https://api.calendly.com/scheduled_events/test/invitees/1",
  scheduled_at: new Date().toISOString(),
  status: "no_show" as const,
  notes: {},
  forecast_cents: null,
  created_at: new Date().toISOString(),
} satisfies SalesCall;

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("SKIP no-show-sequence/orchestrator.test.ts: Supabase env not set");
    return;
  }

  const missingLead = await startNoShowSequence(
    baseSalesCall,
    "00000000-0000-0000-0000-000000000000",
  );
  assert.equal(missingLead.started, false);
  assert.equal(missingLead.reason, "lead_not_found");
  assert.equal(missingLead.dispatched, false);

  console.log("no-show-sequence/orchestrator.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
