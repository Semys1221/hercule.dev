/** Unit tests for workflow sequence UI feedback. */

import assert from "node:assert/strict";

import { formatWorkflowFeedback } from "@/lib/admin/bookings/workflow-feedback";

assert.equal(
  formatWorkflowFeedback("no_show", { started: true, dispatched: true }),
  "Séquence No Show démarrée",
);
assert.equal(
  formatWorkflowFeedback("not_paid", {
    started: true,
    reason: "jobs_already_scheduled",
    dispatched: true,
  }),
  "Séquence Non Payé relancée (emails déjà planifiés)",
);
assert.equal(
  formatWorkflowFeedback("no_show", { started: false, reason: "lead_not_found" }),
  "Séquence No Show non démarrée : lead_not_found",
);

console.log("workflow-feedback.test.ts: ok");
