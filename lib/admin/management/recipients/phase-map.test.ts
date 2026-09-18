import assert from "node:assert/strict";

import {
  isMeetingSequenceSlug,
  phaseForSequenceSlug,
  providerForSlug,
  sequencesForPhase,
} from "@/lib/admin/management/recipients/phase-map";

assert.equal(phaseForSequenceSlug("subsequence-interested"), "outreach");
assert.equal(phaseForSequenceSlug("reply-agent"), "outreach");
assert.equal(phaseForSequenceSlug("meeting-comptable"), "booking");
assert.equal(phaseForSequenceSlug("cif-conference-invite"), "booking");
assert.equal(phaseForSequenceSlug("onboarding-sequence"), "client");
assert.equal(phaseForSequenceSlug("close-indecis"), "client");

assert.equal(providerForSlug("subsequence-interested"), "instantly");
assert.equal(providerForSlug("reply-agent"), "hybrid");
assert.equal(providerForSlug("onboarding-sequence"), "resend");
assert.equal(providerForSlug("cif-conference-invite"), "resend");

assert.equal(isMeetingSequenceSlug("meeting-cif"), true);
assert.equal(isMeetingSequenceSlug("role-recovery"), true);
assert.equal(isMeetingSequenceSlug("onboarding-sequence"), false);

const comptableOutreach = sequencesForPhase("comptable", "outreach");
assert.ok(comptableOutreach.some((entry) => entry.slug === "subsequence-interested"));

const cifBooking = sequencesForPhase("cif", "booking");
assert.ok(cifBooking.some((entry) => entry.slug === "cif-conference-invite"));

console.log("phase-map.test.ts: ok");
