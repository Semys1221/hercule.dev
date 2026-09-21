/** Unit tests for pipeline intro script builder. */

import assert from "node:assert/strict";

import { buildPipelineIntroScript } from "@/lib/legacy/calendly/pipeline-intro-script";

const monthly = buildPipelineIntroScript({
  company_name: "Agence Nova",
  engagement: "monthly_growth",
});

assert.ok(monthly.includes("hercule.dev"));
assert.ok(monthly.includes("Agence Nova"));
assert.ok(monthly.includes("croissance d'entreprise"));

const oneShot = buildPipelineIntroScript({
  company_name: "Studio B2B",
  engagement: "one_shot",
});

assert.ok(oneShot.includes("ponctuellement"));

console.log("OK lib/calendly/pipeline-intro-script.test.ts");
