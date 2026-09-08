/** Unit tests for booking email threading helpers. */

import assert from "node:assert/strict";

import {
  isSequenceFollowUp,
  threadTypesForJob,
} from "@/lib/booking-communication/sequence-pattern";
import {
  buildReplySubject,
  isThreadFollowUp,
  threadTypesForJob as threadingThreadTypesForJob,
} from "@/lib/booking-communication/threading";

function main() {
  assert.equal(isThreadFollowUp("no_show_indecis_1"), false);
  assert.equal(isThreadFollowUp("no_show_indecis_2"), true);
  assert.equal(isThreadFollowUp("no_show_indecis_3"), true);
  assert.equal(isThreadFollowUp("upsell_email_2"), true);

  assert.deepEqual(threadingThreadTypesForJob("no_show_indecis_2"), [
    "no_show_indecis_1",
  ]);
  assert.deepEqual(threadingThreadTypesForJob("no_show_indecis_3"), [
    "no_show_indecis_1",
    "no_show_indecis_2",
  ]);
  assert.deepEqual(threadingThreadTypesForJob("upsell_email_3"), [
    "upsell_email_1",
    "upsell_email_2",
  ]);
  assert.deepEqual(threadTypesForJob("h24_relance"), [
    "immediate",
    "h48_confirm",
  ]);

  assert.equal(
    buildReplySubject("Absence — reprenez un créneau avec Hercule"),
    "Re: Absence — reprenez un créneau avec Hercule",
  );

  assert.equal(isSequenceFollowUp("h48_confirm"), true);

  console.log("threading.test.ts: ok");
}

main();
