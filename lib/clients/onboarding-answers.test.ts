import assert from "node:assert/strict";

import {
  readClientOnboardingAnswers,
  retractionChoiceLabel,
} from "./onboarding-answers";

const base = {
  first_name: "Alice",
  slug: "abcdef",
  profile: {
    video_conference: "google_meet",
    unavailability: "Jeudi PM",
    start_now: false,
    cgv_accepted_version: "2026-09-23",
    cgv_accepted_at: "2026-01-01T12:00:00.000Z",
  },
  onboarding_completed_at: "2026-01-01T12:05:00.000Z",
  retraction_status: "pending",
  retraction_ends_at: "2026-01-05T12:00:00.000Z",
  retraction_waived_at: null,
};

assert.equal(
  retractionChoiceLabel({ ...base, retraction_status: "waived" }),
  "Démarrage immédiat — rétractation levée",
);
assert.match(
  retractionChoiceLabel(base),
  /Délai de rétractation/,
);

const answers = readClientOnboardingAnswers(base);
assert.equal(answers.firstName, "Alice");
assert.equal(answers.onboardingCompletedAt, "2026-01-01T12:05:00.000Z");
assert.equal(answers.startNow, false);
assert.ok(answers.retractionChoice);

console.log("onboarding-answers.test.ts: ok");
