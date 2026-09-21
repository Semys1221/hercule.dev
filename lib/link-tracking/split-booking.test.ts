import assert from "node:assert/strict";

import {
  buildBookingCopyPatch,
  pickBookingSourceRow,
  pickCampaignTargetRow,
} from "./split-booking";
import type { LinkTrackingLead } from "./types";

function lead(partial: Partial<LinkTrackingLead> & Pick<LinkTrackingLead, "email" | "statut">): LinkTrackingLead {
  return {
    id: partial.id ?? "id",
    slug: partial.slug ?? "slug",
    dashboard_link: null,
    instantly_lead_id: partial.instantly_lead_id ?? "instantly-1",
    instantly_campaign_id: null,
    calendly_invitee_uri: null,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    calendly_links_synced_at: null,
    calendly_links_sync_error: null,
    booked_at: null,
    instantly_synced_at: null,
    first_name: null,
    company: null,
    calendly_payload: null,
    calendly_questions: null,
    scheduled_at: null,
    confirmed_at: null,
    instantly_confirmed_synced_at: null,
    onboarding_completed_at: null,
    profile: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...partial,
  };
}

const booked = lead({
  email: "pelissalde@op-invests.com",
  statut: "MEETING_BOOKED",
  booked_at: "2026-09-19T17:56:09Z",
  scheduled_at: "2026-09-23T08:00:00Z",
});

const campaign = lead({
  email: "contact@scpiselect.fr",
  statut: "NOTBOOKED",
});

assert.equal(pickBookingSourceRow([campaign, booked])?.email, booked.email);
assert.equal(
  pickCampaignTargetRow([campaign, booked], "contact@scpiselect.fr")?.email,
  campaign.email,
);

const patch = buildBookingCopyPatch(booked);
assert.equal(patch.statut, "MEETING_BOOKED");
assert.equal(patch.scheduled_at, booked.scheduled_at);

console.log("OK split-booking unit tests passed");
