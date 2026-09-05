/** Unit tests for funnel navigation tree. */

import assert from "node:assert/strict";

import {
  breadcrumb,
  isHub,
  leafKey,
  normalizePath,
} from "@/lib/admin/navigation";

assert.deepEqual(normalizePath(["agence", "sales", "unknown", "extra"]), [
  "agence",
  "sales",
]);

assert.equal(isHub(["agence"]), true);
assert.equal(isHub(["agence", "sales"]), true);
assert.equal(isHub(["agence", "sales", "mockup"]), false);

assert.equal(leafKey(["agence", "sales", "mockup"]), "sales_mockup");
assert.equal(leafKey(["agence", "dashboard"]), "dashboard");

assert.match(breadcrumb(["agence", "sales", "mockup"]), /Funnels.*Agence.*Sales.*Fiches mockup/);

console.log("navigation.test.ts: ok");
