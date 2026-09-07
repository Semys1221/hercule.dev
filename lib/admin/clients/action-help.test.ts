/** Unit tests for cockpit action help email types. */

import assert from "node:assert/strict";

import {
  DELIVERANCE_ACTION_HELP,
  PROPOSE_MATCH_ACTION_HELP,
} from "@/lib/admin/clients/action-help";
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/booking-communication/types";

const validTypes = new Set(BOOKING_EMAIL_TYPE_VALUES);

for (const help of Object.values(DELIVERANCE_ACTION_HELP)) {
  for (const email of help.emails.immediate) {
    assert.ok(validTypes.has(email.type), `${help.id} immediate ${email.type}`);
  }
  for (const email of help.emails.scheduled ?? []) {
    assert.ok(validTypes.has(email.type), `${help.id} scheduled ${email.type}`);
  }
}

for (const email of PROPOSE_MATCH_ACTION_HELP.emails.immediate) {
  assert.ok(validTypes.has(email.type), `propose_match immediate ${email.type}`);
}
for (const email of PROPOSE_MATCH_ACTION_HELP.emails.scheduled ?? []) {
  assert.ok(validTypes.has(email.type), `propose_match scheduled ${email.type}`);
}

console.log("action-help.test.ts: ok");
