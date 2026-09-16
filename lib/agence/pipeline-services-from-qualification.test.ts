/** Unit tests for Revente services prefill (Calendly + session q1). */

import assert from "node:assert/strict";

import { SALES_TEST_SESSION_CALENDLY_QUESTIONS } from "@/lib/admin/funnels/sales-test-session-preset";
import {
  pipelineServicesFromCalendlyQuestions,
  pipelineServicesFromSessionQualification,
  resolvePipelineInitialServices,
} from "@/lib/agence/pipeline-services-from-qualification";

assert.equal(pipelineServicesFromSessionQualification(null), "");
assert.equal(pipelineServicesFromSessionQualification({ q1: [] }), "");

const formatted = pipelineServicesFromSessionQualification({
  q1: ["seo", "google_ads"],
});
assert.match(formatted, /SEO/i);
assert.match(formatted, /Google Ads/i);

const fromCalendly = pipelineServicesFromCalendlyQuestions(
  SALES_TEST_SESSION_CALENDLY_QUESTIONS,
);
assert.match(fromCalendly, /Google Ads/i);
assert.match(fromCalendly, /SEO/i);

const resolved = resolvePipelineInitialServices({
  bookingQuestions: SALES_TEST_SESSION_CALENDLY_QUESTIONS,
  qualificationValues: { q1: ["dev"] },
});
assert.equal(resolved, fromCalendly);

console.log("OK lib/agence/pipeline-services-from-qualification.test.ts");
