/** Unit tests for onboarding FAQ content by audience. */
import assert from "node:assert/strict";

import { getOnboardingFaq } from "./onboarding-faq";

const agence = getOnboardingFaq("agence");
assert.equal(agence.items.length, 8);
assert.match(agence.items[0].a, /\/cvg\)/);
assert.match(agence.items[5].a, /4 jours calendaires/);
assert.match(agence.tieDown, /Conditions générales de vente/);

const comptable = getOnboardingFaq("comptable");
assert.equal(comptable.items.length, 8);
assert.match(comptable.items[0].a, /\/cvg\/comptable\)/);
assert.match(comptable.items[5].a, /aucun délai de rétractation de 4 jours/);
assert.doesNotMatch(comptable.items[5].a, /disposez de 4 jours/);

const entreprise = getOnboardingFaq("entreprise");
assert.equal(entreprise.items.length, 6);
assert.match(entreprise.items[0].a, /gratuites/);
assert.doesNotMatch(
  entreprise.items.map((item) => item.q).join(" "),
  /rétractation/i,
);

console.log("onboarding-faq.test.ts: ok");
