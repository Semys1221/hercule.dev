/** Unit tests for pipeline dev mode detection. */

import assert from "node:assert/strict";

import {
  buildPipelineDevQualification,
  isPipelineDevModeAllowed,
  shouldAutoSkipPipelineWizard,
} from "@/lib/calendly/pipeline-dev-mode";

assert.equal(isPipelineDevModeAllowed("localhost", ""), true);
assert.equal(isPipelineDevModeAllowed("127.0.0.1", ""), true);
assert.equal(isPipelineDevModeAllowed("www.hercule.dev", ""), false);
assert.equal(isPipelineDevModeAllowed("hercule-dev.vercel.app", ""), true);
assert.equal(isPipelineDevModeAllowed("www.hercule.dev", "?dev=1"), true);
assert.equal(shouldAutoSkipPipelineWizard("localhost", "?dev_skip=1"), true);
assert.equal(shouldAutoSkipPipelineWizard("www.hercule.dev", "?dev_skip=1"), false);

const mock = buildPipelineDevQualification({ company_name: "Nova" });
assert.equal(mock.company_name, "Nova");
assert.equal(mock.engagement, "monthly_growth");

console.log("OK lib/calendly/pipeline-dev-mode.test.ts");
