import assert from "node:assert/strict";
import test from "node:test";

import {
  DEMANDE_VERSO_CRITERIA,
  ENTERPRISE_QUALIFICATION_CRITERIA,
} from "./qualification-criteria";

test("ENTERPRISE_QUALIFICATION_CRITERIA has 5 entries", () => {
  assert.equal(ENTERPRISE_QUALIFICATION_CRITERIA.length, 5);
});

test("DEMANDE_VERSO_CRITERIA has exactly 3 verso-only entries", () => {
  assert.equal(DEMANDE_VERSO_CRITERIA.length, 3);
  assert.deepEqual(
    DEMANDE_VERSO_CRITERIA.map((criterion) => criterion.key),
    ["dureeSouhaitee", "horizonResultat", "historiqueAgences"],
  );
});
