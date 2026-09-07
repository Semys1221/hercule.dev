import assert from "node:assert/strict";

import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import {
  isFormSparse,
  resolvePreviewForm,
} from "@/lib/dashboard/resolve-preview-form";

const qualification: Partial<SalesQualificationValues> = {
  q2: ["organic_seo", "paid_acquisition"],
  q20: 4,
  q13: 8000,
  q14: { months3: 2500, months6: 2500, months12: 2500 },
};

assert.equal(isFormSparse({}), true);
assert.equal(isFormSparse({ specialites: ["SEO"] }), false);

const merged = resolvePreviewForm({ zone: "IDF" }, qualification);
assert.deepEqual(merged.zone, "IDF");
assert.ok(merged.specialites?.includes("Acquisition organique / SEO"));
assert.equal(merged.capacite, 4);
assert.equal(merged.budgetMinPonctuel, 8000);
assert.equal(merged.budgetMinMensuel, 2500);

const profileWins = resolvePreviewForm(
  { specialites: ["Branding"], capacite: 2 },
  qualification,
);
assert.deepEqual(profileWins.specialites, ["Branding"]);
assert.equal(profileWins.capacite, 2);

console.log("resolve-preview-form tests passed");
