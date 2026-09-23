import assert from "node:assert/strict";

import type { ClientRow } from "@/lib/clients/types";

import { clientStillOpenForRenewal } from "./monthly-renewal-choice";
import {
  buildMonthlyRenewalEmailText,
  isInJ7Window,
  MONTHLY_RENEWAL_CTA_CONTINUE,
  MONTHLY_RENEWAL_CTA_PAUSE,
  renewalPromptStatus,
  stripeUpdateForRenewalChoice,
  volumeEndLabelForAnnouncement,
} from "./monthly-renewal-announcement";

function client(partial: Partial<ClientRow> = {}): ClientRow {
  return {
    id: "client-a",
    email: "a@test.fr",
    slug: "aaaaaa",
    first_name: "A",
    client_type: "dec",
    secondary_vertical: null,
    billing: "monthly",
    offer_type: "conference_dec_monthly",
    rdv_total: 10,
    rdv_used: 2,
    first_lead_at: "2026-01-01T00:00:00.000Z",
    calendly_scheduling_url: null,
    calendly_event_type_uri: null,
    stripe_customer_id: "cus_123",
    stripe_subscription_id: "sub_123",
    renewal_choice: null,
    renewal_choice_at: null,
    renewal_prompt_closed_at: null,
    product_statut: "IN_DELIVERANCE",
    onboarding_completed_at: "2026-09-23T00:00:00.000Z",
    retraction_status: null,
    retraction_ends_at: null,
    retraction_waived_at: null,
    profile: {},
    created_at: "2026-09-23T00:00:00.000Z",
    updated_at: "2026-09-23T00:00:00.000Z",
    ...partial,
  };
}

const periodEnd = new Date("2026-11-17T08:00:00.000Z");

assert.equal(isInJ7Window(periodEnd, new Date("2026-11-09T22:59:00.000Z")), false);
assert.equal(isInJ7Window(periodEnd, new Date("2026-11-09T23:00:00.000Z")), true);
assert.equal(isInJ7Window(periodEnd, new Date(periodEnd.getTime() - 1)), true);
assert.equal(isInJ7Window(periodEnd, periodEnd), false);

assert.equal(
  renewalPromptStatus({
    client: client(),
    succeededSubscriptionPaymentCount: 1,
    periodEnd,
    now: new Date("2026-11-10T12:00:00.000Z"),
  }),
  "show",
);

assert.equal(
  renewalPromptStatus({
    client: client(),
    succeededSubscriptionPaymentCount: 2,
    periodEnd,
    now: new Date("2026-11-10T12:00:00.000Z"),
  }),
  "expire",
);

assert.equal(
  renewalPromptStatus({
    client: client({ renewal_prompt_closed_at: "2026-11-18T00:00:00.000Z" }),
    succeededSubscriptionPaymentCount: 1,
    periodEnd,
    now: new Date("2026-12-10T12:00:00.000Z"),
  }),
  "closed",
);

assert.equal(
  renewalPromptStatus({
    client: client(),
    succeededSubscriptionPaymentCount: 1,
    periodEnd,
    now: periodEnd,
  }),
  "expire",
);

assert.equal(stripeUpdateForRenewalChoice("continue"), null);
assert.deepEqual(stripeUpdateForRenewalChoice("pause"), {
  pause_collection: { behavior: "void" },
});

const label = volumeEndLabelForAnnouncement({
  succeededAt: "2026-09-23T00:00:00.000Z",
  retraction: null,
  clientType: "dec",
  offerType: "conference_dec_monthly",
  rdvTotal: 10,
  appointments: [],
  slug: "aaaaaa",
  calendarConnected: false,
  now: new Date("2026-11-10T12:00:00.000Z"),
});
assert.equal(label, "mardi 17 novembre 2026");

const email = buildMonthlyRenewalEmailText({
  firstName: "Camille",
  rdvRemaining: 8,
  volumeEndLabel: label,
  dashboardUrl: "https://www.hercule.dev/clients/aaaaaa?renewal=1",
});
assert.match(email, new RegExp(MONTHLY_RENEWAL_CTA_PAUSE));
assert.match(email, new RegExp(MONTHLY_RENEWAL_CTA_CONTINUE));
assert.match(email, /mardi 17 novembre 2026/);
assert.match(email, /8 rendez-vous/);

assert.equal(clientStillOpenForRenewal(client()), true);
assert.equal(
  clientStillOpenForRenewal(client({ renewal_choice: "continue" })),
  false,
);
