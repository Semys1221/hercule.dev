/**
 * Integration smoke for resolveBookingLead fallback order.
 * Requires link-tracking DB (same env as dryRunBookingWorkflow).
 *
 * Usage: tsx lib/admin/bookings/resolve-booking-lead.test.ts
 * Optional: RESOLVE_LEAD_TEST_EMAIL=... RESOLVE_LEAD_TEST_INVITEE_URI=...
 */

import assert from "node:assert/strict";

import { resolveBookingLead } from "@/lib/admin/bookings/resolve-booking-lead";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

async function findSampleLead() {
  const email = process.env.RESOLVE_LEAD_TEST_EMAIL?.trim().toLowerCase();
  const client = createLinkTrackingClient();

  if (email) {
    const { data, error } = await client
      .from("agence")
      .select("id, email, calendly_invitee_uri")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as { id: string; email: string; calendly_invitee_uri: string | null } | null;
  }

  const { data, error } = await client
    .from("agence")
    .select("id, email, calendly_invitee_uri")
    .not("email", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data as { id: string; email: string; calendly_invitee_uri: string | null } | null;
}

async function main() {
  const sample = await findSampleLead();
  if (!sample?.email) {
    console.log("SKIP resolve-booking-lead.test.ts: no agence lead in DB");
    return;
  }

  const inviteeUri =
    process.env.RESOLVE_LEAD_TEST_INVITEE_URI?.trim() ||
    sample.calendly_invitee_uri ||
    "https://api.calendly.com/scheduled_events/smoke/invitees/resolve-lead";

  const byId = await resolveBookingLead({
    leadId: sample.id,
    email: "unknown@example.com",
    inviteeUri,
  });
  assert.equal(byId?.lead.id, sample.id);
  assert.equal(byId?.category, "agence");

  const byEmail = await resolveBookingLead({
    leadId: null,
    email: sample.email,
    inviteeUri: "https://api.calendly.com/scheduled_events/smoke/invitees/missing",
  });
  assert.equal(byEmail?.lead.id, sample.id);

  if (sample.calendly_invitee_uri) {
    const byInvitee = await resolveBookingLead({
      leadId: null,
      email: "unknown@example.com",
      inviteeUri: sample.calendly_invitee_uri,
    });
    assert.equal(byInvitee?.lead.id, sample.id);
  }

  const missing = await resolveBookingLead({
    leadId: null,
    email: "missing-resolve-lead@example.com",
    inviteeUri: "https://api.calendly.com/scheduled_events/smoke/invitees/missing",
  });
  assert.equal(missing, null);

  console.log("resolve-booking-lead.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
