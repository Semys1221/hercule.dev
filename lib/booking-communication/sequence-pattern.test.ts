/** Unit tests for sequence pattern helpers. */

import assert from "node:assert/strict";

import {
  allThreadedEmailTypes,
  isSequenceFollowUp,
  isSequenceRoot,
  sequenceRootTypes,
  threadTypesForJob,
} from "@/lib/booking-communication/sequence-pattern";
import { BOOKING_EMAIL_TYPE_VALUES } from "@/lib/booking-communication/types";

function main() {
  assert.equal(isSequenceRoot("immediate"), true);
  assert.equal(isSequenceRoot("h48_confirm"), false);
  assert.equal(isSequenceFollowUp("upsell_email_2"), true);
  assert.equal(isSequenceFollowUp("upsell_email_1"), false);

  assert.deepEqual(threadTypesForJob("upsell_email_2"), ["upsell_email_1"]);
  assert.deepEqual(threadTypesForJob("onboarding_j1"), [
    "onboarding_j0",
    "onboarding_j0_bis",
  ]);

  const roots = new Set(sequenceRootTypes());
  assert.ok(roots.has("product_payment_welcome"));
  assert.ok(roots.has("no_show_indecis_1"));

  const threaded = new Set(allThreadedEmailTypes());
  for (const emailType of BOOKING_EMAIL_TYPE_VALUES) {
    if (threaded.has(emailType)) {
      assert.ok(
        isSequenceRoot(emailType) || isSequenceFollowUp(emailType),
        `threaded type must be root or follow-up: ${emailType}`,
      );
    }
  }

  console.log("sequence-pattern.test.ts: ok");
}

main();
