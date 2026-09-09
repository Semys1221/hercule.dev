/** Unit tests for funnel navigation tree. */

import assert from "node:assert/strict";

import {
  bookingsHref,
  breadcrumb,
  clientsHubHref,
  emailsHref,
  isHub,
  leafKey,
  legalHref,
  moduleFromPathname,
  nicheFromPathname,
  normalizePath,
  salesFunnelHref,
  sessionHubHref,
} from "@/lib/admin/navigation";
import {
  PRODUCT_ROOT_LABEL,
  SESSION_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";

assert.deepEqual(normalizePath(["agence", "sales", "funnel"]), [
  "agence",
  "sales",
]);

assert.deepEqual(normalizePath(["agence", "sales", "unknown", "extra"]), [
  "agence",
  "sales",
]);

assert.equal(isHub(["agence"]), true);
assert.equal(isHub(["agence", "sales"]), false);
assert.equal(isHub(["agence", "legal"]), true);

assert.equal(leafKey(["agence", "sales"]), null);
assert.equal(leafKey(["agence", "sales", "funnel"]), null);
assert.equal(leafKey(["agence", "clients"]), "clients_hub");

assert.equal(
  salesFunnelHref("agence"),
  "/internal/funnels/agence/sales/funnel",
);

assert.equal(sessionHubHref("agence"), "/internal/funnels/session/agence");
assert.equal(bookingsHref("comptable"), "/internal/funnels/bookings/comptable");

assert.equal(nicheFromPathname("/internal/funnels/bookings/comptable"), "comptable");
assert.equal(nicheFromPathname("/internal/funnels/agence/bookings"), "agence");
assert.equal(nicheFromPathname("/internal/funnels/comptable/sales/funnel"), "comptable");

assert.match(
  breadcrumb(["agence", "sales"]),
  new RegExp(`${PRODUCT_ROOT_LABEL}.*Agence.*${SESSION_MODULE_LABEL}`),
);
assert.match(breadcrumb(["agence", "sales", "funnel"]), /Session/);
assert.doesNotMatch(breadcrumb(["agence", "sales", "funnel"]), /funnel/i);
assert.doesNotMatch(breadcrumb(["agence", "sales"]), /Sales/i);

assert.equal(
  salesFunnelHref("comptable"),
  "/internal/funnels/comptable/sales/funnel",
);

assert.equal(clientsHubHref("comptable"), "/internal/funnels/clients/comptable");
assert.equal(legalHref("agence", "cgv"), "/internal/funnels/legal/agence/cgv");
assert.equal(
  emailsHref("entreprise", "meeting-agence"),
  "/internal/funnels/emails/entreprise/meeting-agence",
);

assert.equal(moduleFromPathname("/internal/funnels/bookings/agence"), "bookings");
assert.equal(moduleFromPathname("/internal/funnels/legal/comptable/cgv"), "legal");
assert.equal(moduleFromPathname("/internal/funnels/agence/bookings"), "bookings");

const redirectSources = [
  "/internal/funnels/agence",
  "/internal/funnels/agence/bookings",
  "/internal/funnels/comptable/clients",
  "/internal/funnels/entreprise/emails",
];
for (const source of redirectSources) {
  assert.ok(nicheFromPathname(source), `nicheFromPathname(${source})`);
}

console.log("navigation.test.ts: ok");
