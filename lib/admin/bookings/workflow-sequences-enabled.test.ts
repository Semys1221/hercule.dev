/** Unit tests for pipeline workflow sequence gating. */

import assert from "node:assert/strict";

import {
  WORKFLOW_SEQUENCES_DISABLED_TOOLTIP,
  workflowSequencesEnabled,
} from "@/lib/admin/bookings/workflow-sequences-enabled";

assert.equal(workflowSequencesEnabled("agence"), false);
assert.equal(workflowSequencesEnabled("entreprise"), false);
assert.equal(workflowSequencesEnabled("comptable"), false);

assert.match(
  WORKFLOW_SEQUENCES_DISABLED_TOOLTIP,
  /désactivées/i,
);

console.log("workflow-sequences-enabled.test.ts: ok");
