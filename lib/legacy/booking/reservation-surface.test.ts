import assert from "node:assert/strict";

import { CIF_CONFERENCE_CALENDLY_URL } from "@/lib/legacy/cif-conference-sequence/constants";
import type { LeadLookup } from "@/lib/legacy/link-tracking/types";

import {
  buildCalendlySchedulingUrl,
  buildReservationSurfaceFromLookup,
  calendlyBaseUrlForLookup,
  conferenceCopy,
  jumCalendlyUrlFromLead,
  surfaceForCategory,
} from "./reservation-surface";

function lookup(
  category: LeadLookup["category"],
  extras: Partial<LeadLookup["lead"]> = {},
): LeadLookup {
  return {
    category,
    lead: {
      id: "1",
      email: "lead@test.fr",
      statut: "NOTBOOKED",
      slug: "abc123",
      dashboard_link: null,
      instantly_lead_id: null,
      instantly_campaign_id: extras.instantly_campaign_id ?? null,
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
      profile: extras.profile ?? null,
      created_at: "",
      updated_at: "",
      ...extras,
    },
  };
}

assert.equal(surfaceForCategory("comptable"), "conference");
assert.equal(surfaceForCategory("cif"), "conference");
assert.equal(surfaceForCategory("comptable_delivery"), "comptable_delivery");

const cifCopy = conferenceCopy("cif");
assert.match(cifCopy.pageTitle, /Conseil en gestion de patrimoine/);
assert.ok(cifCopy.bullets.length >= 2);
const comptableCopy = conferenceCopy("comptable");
assert.match(comptableCopy.pageTitle, /Expertise comptable/);

const scheduled = buildCalendlySchedulingUrl(CIF_CONFERENCE_CALENDLY_URL, {
  email: "a@b.fr",
  slug: "abc123",
});
assert.ok(scheduled.includes("utm_content=abc123"));
assert.ok(scheduled.includes("email=a%40b.fr"));

const jumUrl = jumCalendlyUrlFromLead({
  profile: { jum_segment: "dentiste" },
  instantly_campaign_id: null,
});
assert.ok(jumUrl.includes("dentiste"));

const conference = buildReservationSurfaceFromLookup(lookup("comptable"));
assert.equal(conference.surface, "conference");
assert.equal(conference.conferenceNiche, "comptable");
assert.equal(conference.calendlyUrl, CIF_CONFERENCE_CALENDLY_URL);
assert.equal(conference.theme, "hercule-dark");

const assignedClientUrl = "https://calendly.com/cabinet-dupont/intro";
const assigned = buildReservationSurfaceFromLookup(
  lookup("comptable", { client_id: "client-1" }),
  { calendly_scheduling_url: assignedClientUrl },
);
assert.equal(assigned.calendlyUrl, assignedClientUrl);
assert.equal(
  calendlyBaseUrlForLookup(lookup("comptable", { client_id: "client-1" }), {
    calendly_scheduling_url: assignedClientUrl,
  }),
  assignedClientUrl,
);
assert.equal(
  calendlyBaseUrlForLookup(lookup("comptable", { client_id: "client-1" }), {
    calendly_scheduling_url: null,
  }),
  CIF_CONFERENCE_CALENDLY_URL,
);

const delivery = buildReservationSurfaceFromLookup(
  lookup("comptable_delivery", {
    instantly_campaign_id: "e4f11e76-717e-4be9-a6ad-c7f0a331afb7",
  }),
);
assert.equal(delivery.surface, "comptable_delivery");
assert.equal(delivery.theme, "jum-light");
assert.ok(delivery.calendlyUrl.includes("restaurant"));

console.log("reservation-surface.test.ts: ok");
