import assert from "node:assert/strict";

import { defaultBookingSlugForNiche, nextPhaseForSlug } from "./transitions";

assert.equal(nextPhaseForSlug("subsequence-interested"), "booking");
assert.equal(nextPhaseForSlug("meeting-cif"), "client");
assert.equal(nextPhaseForSlug("onboarding-sequence"), null);

assert.equal(defaultBookingSlugForNiche("cif"), "meeting-cif");
assert.equal(defaultBookingSlugForNiche("agence"), "meeting-agence");

console.log("transitions.test.ts: ok");
