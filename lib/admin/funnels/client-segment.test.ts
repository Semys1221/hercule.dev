/** Unit tests for client segment resolution. */

import assert from "node:assert/strict";

import {
  interpolateClientSegment,
  resolveClientSegment,
} from "./client-segment";

function main() {
  const defaultSegment = resolveClientSegment([]);
  assert.equal(defaultSegment.active, false);
  assert.equal(defaultSegment.label, "TPE");

  const tpeOnly = resolveClientSegment(["tpe"]);
  assert.equal(tpeOnly.active, true);
  assert.equal(tpeOnly.label, "TPE");

  const mixed = resolveClientSegment(["freelancers", "tpe"]);
  assert.equal(mixed.active, true);
  assert.equal(mixed.label, "indépendants / TPE");

  const interpolated = interpolateClientSegment(
    "Missions {clientSegment} éligibles",
    mixed,
  );
  assert.equal(interpolated, "Missions indépendants / TPE éligibles");

  console.log("OK lib/admin/funnels/client-segment.test.ts");
}

main();
