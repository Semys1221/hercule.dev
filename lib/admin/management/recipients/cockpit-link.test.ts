import assert from "node:assert/strict";

import { buildCockpitHref, buildManagementHref } from "./cockpit-link";

assert.equal(buildCockpitHref("comptable", "cabinet-dupont"), "/internal/clients/comptable/cabinet-dupont");
assert.equal(buildCockpitHref("comptable", null), null);
assert.equal(buildCockpitHref("comptable", ""), null);

assert.equal(buildManagementHref("cif"), "/internal/funnels/management/cif");
assert.equal(
  buildManagementHref("cif", "abc-123"),
  "/internal/funnels/management/cif?recipient=abc-123",
);

console.log("cockpit-link.test.ts: ok");
