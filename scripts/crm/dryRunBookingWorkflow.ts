/** Dry-run for bookings cache/status workflow without sending emails. */

import assert from "node:assert/strict";

import { SEQUENCE_TRIGGERED_BY_VALUES } from "@/lib/booking-communication/types";
import { bookingRowActionState } from "@/lib/calendly/booking-row-actions";
import { startNoShowSequence } from "@/lib/no-show-sequence/orchestrator";
import {
  createSalesCallsClient,
  findSalesCallStatusesByInviteeUris,
  updateSalesCallStatus,
  upsertSalesCallFromBooking,
} from "@/lib/sales-calls/supabase";
import type { SalesCall } from "@/lib/sales-calls/types";

const MOCK_INVITEE = `https://api.calendly.com/scheduled_events/dry-run/invitees/${Date.now()}`;
const MOCK_EMAIL = "dry-run-bookings-workflow@example.com";

async function cleanup(client: ReturnType<typeof createSalesCallsClient>, salesCallId: string) {
  await client.from("booking_email_jobs").delete().like("idempotency_key", `dry-run:%`);
  await client.from("sales_calls").delete().eq("id", salesCallId);
}

async function main() {
  assert.ok(SEQUENCE_TRIGGERED_BY_VALUES.includes("sales_call_no_show"));
  assert.equal(bookingRowActionState("paid").badge, "PAID");
  assert.equal(bookingRowActionState("no_show").badge, "NO SHOW");
  assert.equal(bookingRowActionState("not_paid").badge, "NON PAYÉ");

  const missingLead = await startNoShowSequence(
    {
      id: "00000000-0000-0000-0000-000000000000",
      agence_id: null,
      email: MOCK_EMAIL,
      calendly_invitee_uri: MOCK_INVITEE,
      scheduled_at: new Date().toISOString(),
      status: "scheduled",
      notes: {},
      forecast_cents: null,
      created_at: new Date().toISOString(),
    } satisfies SalesCall,
    "00000000-0000-0000-0000-000000000000",
  );
  assert.equal(missingLead.started, false);
  assert.equal(missingLead.reason, "lead_not_found");
  assert.equal(missingLead.dispatched, false);

  const client = createSalesCallsClient();
  const salesCall = await upsertSalesCallFromBooking(client, {
    agenceId: null,
    email: MOCK_EMAIL,
    inviteeUri: MOCK_INVITEE,
    scheduledAt: new Date().toISOString(),
  });

  try {
    const updated = await updateSalesCallStatus(client, salesCall.id, "no_show");
    assert.equal(updated.status, "no_show");

    const statuses = await findSalesCallStatusesByInviteeUris(client, [MOCK_INVITEE]);
    assert.equal(statuses.get(MOCK_INVITEE), "no_show");

    const paid = await updateSalesCallStatus(client, salesCall.id, "paid");
    assert.equal(paid.status, "paid");
    const paidStatuses = await findSalesCallStatusesByInviteeUris(client, [MOCK_INVITEE]);
    assert.equal(paidStatuses.get(MOCK_INVITEE), "paid");

    const { error: jobError } = await client.from("booking_email_jobs").insert({
      lead_category: "agence",
      lead_id: "00000000-0000-0000-0000-000000000000",
      email_type: "no_show_indecis_1",
      scheduled_for: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      idempotency_key: `dry-run:no-show:${salesCall.id}`,
      triggered_by: "sales_call_no_show",
    });

    if (jobError) {
      throw new Error(`job insert failed: ${jobError.message}`);
    }
  } finally {
    await cleanup(client, salesCall.id);
  }

  console.log("booking workflow dry-run passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
