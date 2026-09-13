/** Unit tests for Clients → Séquences tab matrix (Phase 5 §7.2). */

import assert from "node:assert/strict";

import {
  CLIENTS_SEQUENCE_TABS,
  clientsSequenceTabsForNiche,
  isClientsSequenceTabLive,
  resolveClientsSequenceEntry,
} from "@/lib/admin/clients/clients-sequence-tabs";

const ALL_NICHES = ["agence", "comptable", "entreprise", "cif"] as const;
const EXPECTED_CLIENT_TAB_IDS = [
  "payment-welcome",
  "onboarding",
  "calendly-seat",
  "deliverance",
  "matching-booking",
  "survey",
] as const;

for (const niche of ALL_NICHES) {
  const live = clientsSequenceTabsForNiche(niche);
  for (const tabId of EXPECTED_CLIENT_TAB_IDS) {
    assert.ok(
      live.some((tab) => tab.id === tabId),
      `${niche} missing client tab ${tabId}`,
    );
  }
}

assert.equal(clientsSequenceTabsForNiche("agence").length, 6);
assert.equal(clientsSequenceTabsForNiche("comptable").length, 6);
assert.equal(clientsSequenceTabsForNiche("cif").length, 6);
assert.equal(clientsSequenceTabsForNiche("entreprise").length, 7);

const onboarding = CLIENTS_SEQUENCE_TABS.find((tab) => tab.id === "onboarding");
assert.ok(onboarding);
assert.equal(resolveClientsSequenceEntry(onboarding, "agence")?.slug, "onboarding-sequence");
assert.equal(
  resolveClientsSequenceEntry(onboarding, "comptable")?.slug,
  "onboarding-sequence",
);
assert.equal(
  resolveClientsSequenceEntry(onboarding, "entreprise")?.slug,
  "entreprise-sold-check",
);

const payment = CLIENTS_SEQUENCE_TABS.find((tab) => tab.id === "payment-welcome");
assert.ok(payment);
for (const niche of ALL_NICHES) {
  assert.equal(isClientsSequenceTabLive(payment, niche), true);
}

console.log("clients-sequence-tabs.test.ts: ok");
