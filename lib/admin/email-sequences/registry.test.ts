/** Unit tests for email sequence registry audience filtering. */

import assert from "node:assert/strict";

import { getEmailSequences } from "@/lib/admin/email-sequences/registry";

function main() {
  const allSlugs = getEmailSequences("agence").map((entry) => entry.slug);
  const comptableSlugs = getEmailSequences("comptable").map((entry) => entry.slug);

  assert.ok(!allSlugs.includes("both" as never), "no literal both slug");
  assert.equal(
    comptableSlugs.includes("deliverance"),
    false,
    "comptable must not include deliverance (agence+entreprise only)",
  );
  assert.equal(
    comptableSlugs.includes("post-rdv-survey"),
    false,
    "comptable must not include post-rdv-survey",
  );
  assert.equal(
    comptableSlugs.includes("notification-payment"),
    false,
    "comptable must not include notification-payment",
  );
  assert.ok(
    comptableSlugs.includes("subsequence-interested"),
    "comptable includes subsequence-interested",
  );
  assert.ok(
    comptableSlugs.includes("meeting-comptable"),
    "comptable includes meeting-comptable",
  );

  console.log("registry.test.ts: OK");
}

main();
