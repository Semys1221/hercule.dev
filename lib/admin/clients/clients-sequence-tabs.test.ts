/** Unit tests for Clients → Séquences tab matrix (Phase 5 §7.2). */

import assert from "node:assert/strict";

import {
  CLIENTS_SEQUENCE_TABS,
  clientsSequenceTabsForNiche,
  isClientsSequenceTabLive,
  resolveClientsSequenceEntry,
} from "@/lib/admin/clients/clients-sequence-tabs";

const agenceLive = clientsSequenceTabsForNiche("agence");
assert.equal(agenceLive.length, 6);
assert.ok(agenceLive.some((tab) => tab.id === "onboarding"));
assert.ok(agenceLive.some((tab) => tab.id === "matching-booking"));
assert.ok(!agenceLive.some((tab) => tab.id === "matching-proposal"));

const comptableLive = clientsSequenceTabsForNiche("comptable");
assert.equal(comptableLive.length, 0);

const entrepriseLive = clientsSequenceTabsForNiche("entreprise");
assert.equal(entrepriseLive.length, 4);
assert.ok(entrepriseLive.some((tab) => tab.id === "onboarding"));
assert.ok(entrepriseLive.some((tab) => tab.id === "matching-proposal"));
assert.ok(!entrepriseLive.some((tab) => tab.id === "payment-welcome"));

const onboarding = CLIENTS_SEQUENCE_TABS.find((tab) => tab.id === "onboarding");
assert.ok(onboarding);
assert.equal(resolveClientsSequenceEntry(onboarding, "agence")?.slug, "onboarding-sequence");
assert.equal(
  resolveClientsSequenceEntry(onboarding, "entreprise")?.slug,
  "entreprise-sold-check",
);

const payment = CLIENTS_SEQUENCE_TABS.find((tab) => tab.id === "payment-welcome");
assert.ok(payment);
assert.equal(isClientsSequenceTabLive(payment, "agence"), true);
assert.equal(isClientsSequenceTabLive(payment, "comptable"), false);
assert.equal(isClientsSequenceTabLive(payment, "entreprise"), false);

console.log("clients-sequence-tabs.test.ts: ok");
