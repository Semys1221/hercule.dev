/** Unit tests for onboarding FAQ content by audience. */
import assert from "node:assert/strict";

import type { BleedTrack } from "@/lib/admin/funnels/sales-bleed-track";
import {
  getHesitationSlides,
  getIntentionOptions,
  getOnboardingFaq,
} from "./onboarding-faq";

const mockBleed: BleedTrack = {
  businessNoun: "cabinet",
  cause: "l'invisibilité locale",
  causeId: "invisibilite",
  primaryBrake: "SEO sans garantie",
  gap: "12 mandats/an",
  gapId: "gap_12",
  duration: "2019",
  synthesis: [],
  honorairesAnnual: 180000,
};

const mockContext = {
  bleed: mockBleed,
  firstName: "Jean",
  zone: "Rhône (69)",
};

const agence = getOnboardingFaq("agence");
assert.equal(agence.items.length, 12);
assert.equal(agence.items[0].id, "obj-payment");
assert.equal(agence.items[1].id, "obj-associe");
assert.equal(agence.items[2].id, "obj-reflechir");
assert.match(agence.items[3].a, /\/cvg\)/);
assert.match(
  agence.items.find((item) => item.id === "ag-retractation")?.a ?? "",
  /4 jours calendaires/,
);
assert.match(agence.tieDown, /pendant cette session d'audit/);
assert.match(agence.tieDown, /lancer le service/);
assert.match(
  agence.items.find((item) => item.id === "ag-delai-rdv")?.a ?? "",
  /30 jours.*8 jours ouvrés/,
);

const comptable = getOnboardingFaq("comptable", mockContext);
assert.equal(comptable.items.length, 12);
assert.equal(comptable.items[0].id, "obj-payment");
assert.match(comptable.items[0].a, /un seul cabinet/);
assert.match(
  comptable.items.find((item) => item.id === "obj-associe")?.a ?? "",
  /180.?000/,
);
assert.match(
  comptable.items.find((item) => item.id === "obj-associe")?.a ?? "",
  /12 mandats\/an/,
);
assert.match(
  comptable.items.find((item) => item.id === "obj-reflechir")?.a ?? "",
  /l'invisibilité locale/,
);
assert.doesNotMatch(
  comptable.items.slice(0, 3).map((item) => item.a).join(" "),
  /10.*RDV|20.?25 jours|998|1.?499/,
);
assert.match(comptable.tieDown, /Foundation sur la zone du cabinet/);

const cif = getOnboardingFaq("cif");
assert.equal(cif.items.length, 12);
assert.equal(cif.items[0].id, "obj-payment");
assert.match(cif.items[3].a, /\/cvg\/conseil-financier\)/);
assert.match(cif.tieDown, /\/cvg\/conseil-financier\)/);

const entreprise = getOnboardingFaq("entreprise");
assert.equal(entreprise.items.length, 6);
assert.equal(entreprise.items[0].id, "en-gratuit");
assert.doesNotMatch(
  entreprise.items.map((item) => item.q).join(" "),
  /rétractation/i,
);

const agenceIntentions = getIntentionOptions("agence");
assert.equal(agenceIntentions.length, 3);
assert.match(agenceIntentions[0].label, /100 % partant/);

const cabinetIntentions = getIntentionOptions("comptable");
assert.match(cabinetIntentions[0].label, /sécurise la zone/);
assert.doesNotMatch(
  cabinetIntentions.map((item) => item.label).join(" "),
  /pour voir|tester|recevoir des demandes/i,
);

const agenceSlides = getHesitationSlides("agence", mockContext);
assert.equal(agenceSlides.length, 3);

const cabinetSlides = getHesitationSlides("cif", mockContext);
assert.equal(cabinetSlides.length, 4);
assert.match(cabinetSlides[3].alert ?? "", /Rhône \(69\)/);
assert.match(cabinetSlides[3].body, /Jean/);

console.log("onboarding-faq.test.ts: ok");
