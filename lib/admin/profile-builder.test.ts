/** Unit tests for admin profile builder. */

import assert from "node:assert/strict";

import { buildDefaultProfile } from "@/lib/admin/profile-builder";

const agenceProfile = buildDefaultProfile(
  { besoin: "Site web", droit_retractation: true },
  "agence",
);

assert.equal((agenceProfile.form as { besoin: string }).besoin, "Site web");
assert.equal(
  (agenceProfile.communication as { delays: { retraction_days: number } }).delays
    .retraction_days,
  4,
);
assert.equal((agenceProfile.match as { active_rdv: boolean }).active_rdv, false);
assert.equal(
  (agenceProfile.display as { timeline: unknown[] }).timeline.length,
  4,
);

const entrepriseProfile = buildDefaultProfile({ besoin: "Refonte" }, "entreprise");
assert.equal(
  (entrepriseProfile.communication as { delays: { retraction_days: number } }).delays
    .retraction_days,
  0,
);
assert.equal(
  (entrepriseProfile.display as { timeline: { label: string }[] }).timeline[0].label,
  "Qualification de votre besoin",
);

console.log("profile-builder.test.ts: ok");
