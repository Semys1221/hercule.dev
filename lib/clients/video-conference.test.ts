/** Unit tests for client video conference helpers. */

import assert from "node:assert/strict";

import { buildOnboardingVideoConferenceEmailBody } from "@/lib/(resend)/clients/workflows/onboarding-video-conference";
import {
  CONFERENCE_CLIENT_TYPES,
  OFFER_TYPES_CONFERENCE,
} from "@/lib/commercial/conference-pricing";
import type { ClientRow } from "@/lib/clients/types";
import {
  CLIENT_VIDEO_CONFERENCE_OPTIONS,
  isClientVideoConference,
  parseClientVideoConference,
  videoConferenceLabel,
  videoConferenceOpsAction,
} from "@/lib/clients/video-conference";

const baseClient: ClientRow = {
  id: "client-test-1",
  email: "client@example.com",
  slug: "client-test",
  first_name: "Marie",
  client_type: CONFERENCE_CLIENT_TYPES.dec,
  secondary_vertical: null,
  billing: "monthly",
  offer_type: OFFER_TYPES_CONFERENCE.decMonthly,
  rdv_total: 10,
  rdv_used: 0,
  first_lead_at: "2026-01-01T00:00:00.000Z",
  calendly_scheduling_url: null,
  calendly_event_type_uri: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  product_statut: "ONBOARDED",
  onboarding_completed_at: "2026-09-22T00:00:00.000Z",
  retraction_status: "pending",
  retraction_ends_at: null,
  retraction_waived_at: null,
  profile: { video_conference: "zoom_pro" },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-09-22T00:00:00.000Z",
};

for (const option of CLIENT_VIDEO_CONFERENCE_OPTIONS) {
  assert.equal(isClientVideoConference(option), true);
  assert.ok(videoConferenceLabel(option).length > 0);
}

assert.equal(isClientVideoConference("skype"), false);
assert.equal(parseClientVideoConference({ video_conference: "google_meet_pro" }), "google_meet_pro");
assert.equal(parseClientVideoConference({ video_conference: "invalid" }), null);
assert.equal(parseClientVideoConference(null), null);
assert.equal(videoConferenceLabel(null), "Microsoft Teams — non défini");

assert.match(
  videoConferenceOpsAction("zoom_pro"),
  /Provisionner un compte Zoom Pro/,
);
assert.match(
  videoConferenceOpsAction("microsoft_teams_pro"),
  /compte visio existant/,
);

const emailBody = buildOnboardingVideoConferenceEmailBody({
  client: baseClient,
  videoConference: "zoom_pro",
});

assert.match(emailBody, /Marie/);
assert.match(emailBody, /client@example.com/);
assert.match(emailBody, /Zoom Pro/);
assert.match(emailBody, /Provisionner un compte Zoom Pro/);
assert.match(emailBody, /\/clients\/client-test/);

console.log("video-conference.test.ts: ok");
