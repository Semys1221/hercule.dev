/** Unit tests for batch link provision helpers. */

import assert from "node:assert/strict";

import { normalizeProvisionEmails } from "@/lib/link-tracking/provision-by-emails";
import { needsProvision } from "@/lib/link-tracking/provision-from-list-internals";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

assert.deepEqual(
  normalizeProvisionEmails([
    "  Alice@Example.COM  ",
    "alice@example.com",
    "bad",
    "",
    "bob@test.com",
  ]),
  ["alice@example.com", "bob@test.com"],
);

assert.deepEqual(
  normalizeProvisionEmails(Array.from({ length: 150 }, (_, i) => `lead${i}@test.com`), 100),
  Array.from({ length: 100 }, (_, i) => `lead${i}@test.com`),
);

const lookup = new Map<
  string,
  { category: "cif" | "comptable"; lead: LinkTrackingLead }
>();

lookup.set("new@test.com", {
  category: "cif",
  lead: {
    id: "1",
    email: "new@test.com",
    slug: "abc123",
    reservation_cif_link: "https://example.com/cif",
    confirmation_cif_link: "https://example.com/confirm",
  } as LinkTrackingLead,
});

assert.equal(needsProvision("new@test.com", lookup, "cif"), false);
assert.equal(needsProvision("missing@test.com", lookup, "cif"), true);

lookup.set("wrong@test.com", {
  category: "comptable",
  lead: {
    id: "2",
    email: "wrong@test.com",
    slug: "xyz789",
    reservation_comptable_link: "https://example.com/comptable",
    confirmation_comptable_link: "https://example.com/confirm",
  } as LinkTrackingLead,
});

assert.equal(needsProvision("wrong@test.com", lookup, "cif"), false);

console.log("OK provision-by-emails unit tests passed");
