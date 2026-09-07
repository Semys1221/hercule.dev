/** Unit tests for batch lead lookup priority in Calendly list bookings. */

import assert from "node:assert/strict";

import { resolveLeadFromBatchMaps } from "@/lib/calendly/list-bookings";
import type { LeadLookup, LinkTrackingLead } from "@/lib/link-tracking/types";

function lead(id: string, email: string): LinkTrackingLead {
  return {
    id,
    email,
    statut: "MEETING_BOOKED",
    slug: `slug-${id}`,
    reservation_agence_link: null,
    reservation_entreprise_link: null,
    confirmation_agence_link: null,
    dashboard_link: null,
    instantly_lead_id: null,
    instantly_campaign_id: null,
    first_name: "Marie",
    company: "Acme",
    scheduled_at: null,
    calendly_invitee_uri: `https://api.calendly.com/scheduled_events/EVT/invitees/${id}`,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
  };
}

function lookup(category: "agence" | "entreprise", id: string, email: string): LeadLookup {
  return { category, lead: lead(id, email) };
}

const candidate = {
  email: "prospect@example.com",
  utmContent: "slug-slug",
  inviteeUri: "https://api.calendly.com/scheduled_events/EVT/invitees/INV",
};

const emailLookup = lookup("agence", "email-lead", candidate.email);
const slugLookup = lookup("agence", "slug-lead", "other@example.com");
const inviteeLookup = lookup("agence", "invitee-lead", "another@example.com");

const byEmail = new Map([[candidate.email, emailLookup]]);
const bySlug = new Map([[candidate.utmContent, slugLookup]]);
const byInviteeUri = new Map([[candidate.inviteeUri, inviteeLookup]]);

assert.equal(
  resolveLeadFromBatchMaps(candidate, byEmail, bySlug, byInviteeUri)?.lead.id,
  "email-lead",
);

assert.equal(
  resolveLeadFromBatchMaps(
    candidate,
    new Map(),
    bySlug,
    byInviteeUri,
  )?.lead.id,
  "slug-lead",
);

assert.equal(
  resolveLeadFromBatchMaps(
    candidate,
    new Map(),
    new Map(),
    byInviteeUri,
  )?.lead.id,
  "invitee-lead",
);

assert.equal(
  resolveLeadFromBatchMaps(candidate, new Map(), new Map(), new Map()),
  null,
);

console.log("list-bookings.test.ts: ok");
