/** Unit tests for no-show action gating (independent of confirmation sequences). */

import assert from "node:assert/strict";

import { noShowActionsEnabled } from "@/lib/legacy/admin/bookings/no-show-actions-enabled";

assert.equal(noShowActionsEnabled("cif"), true);
assert.equal(noShowActionsEnabled("comptable"), true);
assert.equal(noShowActionsEnabled("agence"), true);
assert.equal(noShowActionsEnabled("entreprise"), true);

console.log("no-show-actions-enabled.test.ts: ok");
