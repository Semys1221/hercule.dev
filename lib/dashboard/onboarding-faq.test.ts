/** Unit tests for onboarding FAQ content by audience. */
import assert from "node:assert/strict";

import { getOnboardingFaq } from "./onboarding-faq";

const agence = getOnboardingFaq("agence");
assert.equal(agence.items.length, 9);
assert.match(agence.items[0].a, /\/cvg\)/);
assert.match(agence.items[6].a, /4 jours calendaires/);
assert.match(agence.tieDown, /Conditions générales de vente/);
assert.match(
  agence.items.find((item) => item.id === "ag-delai-rdv")?.a ?? "",
  /30 jours.*8 jours ouvrés/,
);
assert.match(
  agence.items.find((item) => item.id === "ag-retard-livraison")?.a ?? "",
  /7 jours.*dispute.*amiable/s,
);
assert.match(
  agence.items.find((item) => item.id === "ag-retard-livraison")?.a ?? "",
  /\/cvg\)/,
);

const comptable = getOnboardingFaq("comptable");
assert.equal(comptable.items.length, 9);
assert.match(comptable.items[0].a, /\/cvg\/comptable\)/);
assert.match(comptable.items[6].a, /4 jours calendaires/);
assert.match(comptable.items[6].a, /renoncer.*dashboard/s);
assert.match(comptable.items[6].a, /\/cvg\/comptable\)/);
assert.match(
  comptable.items.find((item) => item.id === "cp-retard-livraison")?.a ?? "",
  /7 jours.*dispute.*amiable/s,
);
assert.match(
  comptable.items.find((item) => item.id === "cp-retard-livraison")?.a ?? "",
  /\/cvg\/comptable\)/,
);

const entreprise = getOnboardingFaq("entreprise");
assert.equal(entreprise.items.length, 6);
assert.match(entreprise.items[0].a, /gratuites/);
assert.doesNotMatch(
  entreprise.items.map((item) => item.q).join(" "),
  /rétractation/i,
);

console.log("onboarding-faq.test.ts: ok");
