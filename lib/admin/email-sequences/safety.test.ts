/** Unit tests for email sequence safety evaluation. */

import assert from "node:assert/strict";

import { evaluateSequenceSafety } from "@/lib/admin/email-sequences/safety";
import { getEmailSequences } from "@/lib/admin/email-sequences/registry";

const AGENCE_RESEND_ON = [
  "meeting-agence",
  "role-recovery",
  "upsell",
  "calendly-seat-onboarding",
  "close-indecis",
  "sales-call-no-show",
  "payment-welcome",
  "onboarding-sequence",
  "deliverance",
  "matching-booking",
  "post-rdv-survey",
  "notification-payment",
];

const AGENCE_NON_RESEND = [
  "outreach-stats",
  "subsequence-interested",
  "reply-agent",
  "no-show",
];

function main() {
  const sequences = getEmailSequences("agence");
  const bySlug = new Map(sequences.map((entry) => [entry.slug, entry]));

  for (const slug of AGENCE_RESEND_ON) {
    const entry = bySlug.get(slug);
    assert.ok(entry, `missing sequence: ${slug}`);
    assert.equal(
      evaluateSequenceSafety(entry, "agence"),
      "on",
      `expected ON for ${slug}`,
    );
  }

  for (const slug of AGENCE_NON_RESEND) {
    const entry = bySlug.get(slug);
    assert.ok(entry, `missing sequence: ${slug}`);
    assert.equal(
      evaluateSequenceSafety(entry, "agence"),
      null,
      `expected null safety for ${slug}`,
    );
  }

  const comptableSequences = getEmailSequences("comptable");
  const comptableBySlug = new Map(comptableSequences.map((entry) => [entry.slug, entry]));
  const comptableEntry = comptableBySlug.get("meeting-comptable");
  assert.ok(comptableEntry, "missing meeting-comptable in comptable catalogue");
  assert.equal(
    evaluateSequenceSafety(comptableEntry, "comptable"),
    "off",
    "comptable meeting defaults pending dedicated copy in DB",
  );

  console.log("safety.test.ts: ok");
}

main();
