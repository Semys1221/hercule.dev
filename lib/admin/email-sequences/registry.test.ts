/** Unit tests for email sequence registry audience filtering. */

import assert from "node:assert/strict";

import { getEmailSequences } from "@/lib/admin/email-sequences/registry";

function main() {
  const allSlugs = getEmailSequences("agence").map((entry) => entry.slug);
  const comptableSlugs = getEmailSequences("comptable").map((entry) => entry.slug);

  assert.ok(!allSlugs.includes("both" as never), "no literal both slug");
  assert.ok(
    comptableSlugs.includes("deliverance"),
    "comptable includes deliverance",
  );
  assert.ok(
    comptableSlugs.includes("post-rdv-survey"),
    "comptable includes post-rdv-survey",
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

  const cifSlugs = getEmailSequences("cif").map((entry) => entry.slug);
  assert.ok(cifSlugs.includes("meeting-cif"), "cif includes meeting-cif");
  assert.ok(
    cifSlugs.includes("subsequence-interested"),
    "cif includes subsequence-interested",
  );

  console.log("registry.test.ts: OK");
}

main();
