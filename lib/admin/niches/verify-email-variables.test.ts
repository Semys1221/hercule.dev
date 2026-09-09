/** Unit tests for email variable verify helpers. */

import assert from "node:assert/strict";

import { detectCrossNicheWarnings } from "@/lib/admin/niches/verify-email-variables";
import {
  buildVariableToSequenceSlugsMap,
  collectUsedVariableKeys,
} from "@/lib/admin/niches/live-sequence-variables";
import {
  formatCoverage,
  isInstantlyValueFilled,
  isSupabaseValueFilled,
  resolveInstantlyKey,
  resolveSupabaseColumn,
} from "@/lib/admin/niches/variable-resolution";

function main() {
  const entries = [
    {
      slug: "meeting-agence",
      texts: ["Hello {{firstNameLine}}", "Link {{reservation_agence_link}}"],
    },
    {
      slug: "payment-welcome",
      texts: ["{{dashboardLink}}"],
    },
  ];

  const used = collectUsedVariableKeys(entries);
  assert.ok(used.has("firstNameLine"));
  assert.ok(used.has("reservation_agence_link"));
  assert.ok(used.has("dashboardLink"));

  const slugMap = buildVariableToSequenceSlugsMap(entries);
  assert.deepEqual(slugMap.get("reservation_agence_link"), ["meeting-agence"]);

  assert.equal(formatCoverage(0, 0), "—");
  assert.equal(formatCoverage(3, 10), "3/10");

  assert.equal(resolveSupabaseColumn("confirmLink", "agence"), "confirmation_agence_link");
  assert.equal(
    resolveSupabaseColumn("confirmLink", "comptable"),
    "confirmation_comptable_link",
  );
  assert.equal(resolveInstantlyKey("reservation_comptable_link", "comptable"), "reservation_entreprise_link");

  const row = {
    email: "test@example.com",
    confirmation_agence_link: "https://example.com/confirm",
    reservation_agence_link: "",
  };
  assert.equal(isSupabaseValueFilled(row, "confirmation_agence_link", "agence"), true);
  assert.equal(isSupabaseValueFilled(row, "reservation_agence_link", "agence"), false);

  assert.equal(
    isInstantlyValueFilled(
      { reservation_agence_link: "https://x.dev/a" },
      "reservation_agence_link",
      "agence",
    ),
    true,
  );
  assert.equal(
    isInstantlyValueFilled({}, "reservation_agence_link", "agence"),
    false,
  );
  assert.equal(isInstantlyValueFilled({}, "firstNameLine", "agence"), true);

  const warnings = detectCrossNicheWarnings({
    usedKeys: new Set(["confirmLink"]),
    crossNicheMap: new Map([["confirmLink", ["agence", "comptable"]]]),
    currentNiche: "agence",
  });
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.variableKey, "confirmLink");

  const noWarnings = detectCrossNicheWarnings({
    usedKeys: new Set(["confirmLink"]),
    crossNicheMap: new Map([["confirmLink", ["agence"]]]),
    currentNiche: "agence",
  });
  assert.equal(noWarnings.length, 0);

  console.log("verify-email-variables.test.ts: OK");
}

main();
