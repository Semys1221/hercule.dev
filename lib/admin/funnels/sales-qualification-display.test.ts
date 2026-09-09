/** Unit tests for sales qualification display helpers. */

import assert from "node:assert/strict";

import {
  formatClosingAnswers,
  formatQualificationAnswers,
  getSalesSessionStorageRows,
} from "@/lib/admin/funnels/sales-qualification-display";
import { SALES_SKIP_VALUE } from "@/lib/admin/funnels/sales-qualification-schema";

const multiRow = formatQualificationAnswers("agence", {
  q1: ["seo", "google_ads"],
});
assert.ok(
  multiRow.some((row) => row.id === "q1" && row.answer.includes("SEO")),
  "multi choice should resolve option labels",
);

const skipRow = formatQualificationAnswers("agence", {
  q15: SALES_SKIP_VALUE,
});
assert.ok(
  skipRow.some((row) => row.id === "q15"),
  "conditional skip value should produce a row",
);

const sliderRow = formatQualificationAnswers("agence", {
  q3: 5,
});
assert.ok(
  sliderRow.some((row) => row.id === "q3" && row.answer === "5"),
  "slider count should format as number",
);

const closingRows = formatClosingAnswers({
  reglesAccepted: true,
  calendrierAccepted: false,
});
assert.equal(closingRows.length, 2);
assert.equal(closingRows[0]?.answer, "Oui");
assert.equal(closingRows[1]?.answer, "Non");

const storageRows = getSalesSessionStorageRows({
  audience: "agence",
  salesCallId: "00000000-0000-4000-8000-000000000001",
  inviteeUri: "https://api.calendly.com/scheduled_events/abc/invitees/xyz",
  leadCategory: "agence",
});
assert.ok(
  storageRows.some((row) => row.value.includes("agence.profile.form")),
  "agence storage should include profile sync path",
);

console.log("sales-qualification-display.test.ts: all assertions passed");
