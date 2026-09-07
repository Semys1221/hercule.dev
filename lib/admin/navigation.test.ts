/** Unit tests for funnel navigation tree. */

import assert from "node:assert/strict";

import {
  breadcrumb,
  isHub,
  leafKey,
  normalizePath,
  salesFunnelHref,
} from "@/lib/admin/navigation";
import {
  PRODUCT_ROOT_LABEL,
  SESSION_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";

assert.deepEqual(normalizePath(["agence", "sales", "funnel"]), [
  "agence",
  "sales",
]);

assert.deepEqual(normalizePath(["agence", "sales", "unknown", "extra"]), [
  "agence",
  "sales",
]);

assert.equal(isHub(["agence"]), true);
assert.equal(isHub(["agence", "sales"]), false);
assert.equal(isHub(["agence", "legal"]), true);

assert.equal(leafKey(["agence", "sales"]), null);
assert.equal(leafKey(["agence", "sales", "funnel"]), null);
assert.equal(leafKey(["agence", "clients"]), "clients_hub");

assert.equal(
  salesFunnelHref("agence"),
  "/internal/funnels/agence/sales/funnel",
);

assert.match(
  breadcrumb(["agence", "sales"]),
  new RegExp(`${PRODUCT_ROOT_LABEL}.*Agence.*${SESSION_MODULE_LABEL}`),
);
assert.match(breadcrumb(["agence", "sales", "funnel"]), /Session/);
assert.doesNotMatch(breadcrumb(["agence", "sales", "funnel"]), /funnel/i);
assert.doesNotMatch(breadcrumb(["agence", "sales"]), /Sales/i);

console.log("navigation.test.ts: ok");
