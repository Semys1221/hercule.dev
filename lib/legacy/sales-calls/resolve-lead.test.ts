import assert from "node:assert/strict";

import { upsertIdsForLeadCategory } from "./resolve-lead";

assert.deepEqual(upsertIdsForLeadCategory("comptable", "cccccccc-cccc-cccc-cccc-cccccccccccc"), {
  leadId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
});

console.log("resolve-lead.test.ts OK");
