/** Unit tests for bleed track derivation and interpolation. */

import assert from "node:assert/strict";

import {
  buildBleedTrack,
  formatBleedStickyChips,
  interpolateBleed,
} from "@/lib/admin/funnels/sales-bleed-track";
import { SALES_TEST_SESSION_COMPTABLE_QUALIFICATION } from "@/lib/admin/funnels/sales-test-session-preset";

function main() {
  const bleed = buildBleedTrack(SALES_TEST_SESSION_COMPTABLE_QUALIFICATION, "comptable");

  assert.equal(bleed.businessNoun, "cabinet");
  assert.equal(bleed.goalType, "more_volume");
  assert.match(bleed.goal ?? "", /600/);
  assert.match(bleed.goal ?? "", /dossiers/);
  assert.match(bleed.current ?? "", /90 clients/);
  assert.equal(bleed.openingYear, "2020");
  assert.match(bleed.primaryMethod ?? "", /Bouche-à-oreille/);
  assert.match(bleed.methodBrake ?? bleed.cause, /scalable|relations/i);
  assert.match(bleed.gap ?? "", /\+3 dossiers/);
  assert.match(bleed.gap ?? "", /ne pas stagner|philosophie/i);
  assert.equal(bleed.honorairesAnnual, SALES_TEST_SESSION_COMPTABLE_QUALIFICATION.q13);
  assert.equal(bleed.reservedCapacity, SALES_TEST_SESSION_COMPTABLE_QUALIFICATION.q20);

  const interpolated = interpolateBleed(
    "Depuis {year}, {method} bridé par {cause} — écart {gap}",
    bleed,
  );
  assert.match(interpolated, /2020/);
  assert.match(interpolated, /Bouche-à-oreille/);
  assert.doesNotMatch(interpolated, /\{year\}/);

  const chips = formatBleedStickyChips(bleed);
  assert.ok(chips.length > 0);
  assert.ok(chips.length <= 3);

  const emptyBleed = buildBleedTrack(
    {
      ...SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
      w1: undefined,
      w2: undefined,
      w3: undefined,
      w4: undefined,
      w5: undefined,
      w6: undefined,
      w7: undefined,
      w8: undefined,
      b1: undefined,
      b2: undefined,
      b4: undefined,
      b5: [],
      b7: undefined,
      b8: undefined,
    },
    "comptable",
  );
  assert.equal(emptyBleed.goal, undefined);
  assert.equal(emptyBleed.cause, "");

  console.log("OK lib/admin/funnels/sales-bleed-track.test.ts");
}

main();
