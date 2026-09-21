/** Unit tests for sales closing section completion rules. */

import assert from "node:assert/strict";

import {
  isSalesClosingSectionComplete,
  salesClosingDefaultValues,
} from "./sales-closing-sections";

const emptyVisited = new Set<
  "recap" | "regles-traitement" | "demandes-eligibles" | "calendrier" | "envoi-dashboard"
>();

assert.equal(
  isSalesClosingSectionComplete("recap", {
    values: salesClosingDefaultValues,
    visitedIds: emptyVisited,
    activeClosingId: "recap",
  }),
  false,
  "recap should not be complete on first landing",
);

assert.equal(
  isSalesClosingSectionComplete("recap", {
    values: salesClosingDefaultValues,
    visitedIds: new Set(["recap"]),
    activeClosingId: "recap",
  }),
  true,
  "recap should be complete once visited, including while active",
);

assert.equal(
  isSalesClosingSectionComplete("recap", {
    values: salesClosingDefaultValues,
    visitedIds: new Set(["recap"]),
    activeClosingId: "regles-traitement",
  }),
  true,
  "recap should be complete after leaving recap",
);

assert.equal(
  isSalesClosingSectionComplete("demandes-eligibles", {
    values: salesClosingDefaultValues,
    visitedIds: emptyVisited,
    activeClosingId: "recap",
  }),
  false,
  "demandes-eligibles should not be complete before visit",
);

assert.equal(
  isSalesClosingSectionComplete("demandes-eligibles", {
    values: salesClosingDefaultValues,
    visitedIds: new Set(["demandes-eligibles"]),
    activeClosingId: "calendrier",
  }),
  false,
  "demandes-eligibles should not be complete when regles are not accepted",
);

assert.equal(
  isSalesClosingSectionComplete("demandes-eligibles", {
    values: { ...salesClosingDefaultValues, reglesAccepted: true },
    visitedIds: new Set(["recap", "demandes-eligibles"]),
    activeClosingId: "calendrier",
  }),
  true,
  "demandes-eligibles should be complete after visit when prior steps are validated",
);

assert.equal(
  isSalesClosingSectionComplete("regles-traitement", {
    values: { ...salesClosingDefaultValues, reglesAccepted: true },
    visitedIds: emptyVisited,
    activeClosingId: "regles-traitement",
  }),
  false,
  "regles-traitement should not be complete when recap is not visited",
);

assert.equal(
  isSalesClosingSectionComplete("regles-traitement", {
    values: { ...salesClosingDefaultValues, reglesAccepted: true },
    visitedIds: new Set(["recap"]),
    activeClosingId: "regles-traitement",
  }),
  true,
  "regles-traitement should follow checkbox state when recap is visited",
);

assert.equal(
  isSalesClosingSectionComplete("calendrier", {
    values: { ...salesClosingDefaultValues, calendrierAccepted: false },
    visitedIds: emptyVisited,
    activeClosingId: "calendrier",
  }),
  false,
  "calendrier should follow checkbox state",
);

assert.equal(
  isSalesClosingSectionComplete("calendrier", {
    values: { ...salesClosingDefaultValues, calendrierAccepted: true },
    visitedIds: new Set(["recap", "demandes-eligibles"]),
    activeClosingId: "calendrier",
  }),
  false,
  "calendrier should not be complete when regles are not accepted",
);

assert.equal(
  isSalesClosingSectionComplete("calendrier", {
    values: {
      ...salesClosingDefaultValues,
      reglesAccepted: true,
      calendrierAccepted: true,
    },
    visitedIds: new Set(["recap", "demandes-eligibles"]),
    activeClosingId: "calendrier",
  }),
  true,
  "calendrier should be complete when checkbox is checked and prior steps are validated",
);

assert.equal(
  isSalesClosingSectionComplete("envoi-dashboard", {
    values: salesClosingDefaultValues,
    visitedIds: new Set(["envoi-dashboard"]),
    activeClosingId: "envoi-dashboard",
  }),
  false,
  "envoi-dashboard should never auto-complete",
);

console.log("sales-closing-sections.test.ts: ok");
