import assert from "node:assert/strict";

import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import {
  resolveSalesSessionConfirmationLink,
  resolveSalesSessionReservationLink,
} from "./sales-session-links";

const comptableLead = {
  slug: "cabinet-test",
  email: "test@example.com",
  reservation_comptable_link: "https://www.hercule.dev/reservation-comptable.html/cabinet-test",
  confirmation_comptable_link: "https://www.hercule.dev/confirmation-comptable.html/cabinet-test",
  reservation_agence_link: "https://www.hercule.dev/reservation.html/cabinet-test",
  confirmation_agence_link: "https://www.hercule.dev/confirmation.html/cabinet-test",
} as LinkTrackingLead;

assert.equal(
  resolveSalesSessionReservationLink("comptable", comptableLead, undefined),
  comptableLead.reservation_comptable_link,
  "comptable reservation should use reservation_comptable_link",
);

assert.equal(
  resolveSalesSessionConfirmationLink("comptable", comptableLead, undefined),
  comptableLead.confirmation_comptable_link,
  "comptable confirmation should use confirmation_comptable_link",
);

assert.equal(
  resolveSalesSessionReservationLink("agence", comptableLead, undefined),
  comptableLead.reservation_agence_link,
  "agence reservation should use reservation_agence_link",
);

console.log("sales-session-links.test.ts: ok");
