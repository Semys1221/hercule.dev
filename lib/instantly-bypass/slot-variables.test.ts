/** Unit tests for bypass template slot variables. */

import assert from "node:assert/strict";

import {
  buildSlotVariablesFromLabels,
  templateRequiresSlotVariables,
} from "@/lib/instantly-bypass/slot-variables";

function main() {
  assert.equal(templateRequiresSlotVariables("Hello {{slot_1}}"), true);
  assert.equal(templateRequiresSlotVariables("Hello {{slot_2}}"), true);
  assert.equal(templateRequiresSlotVariables("No slots here"), false);

  assert.deepEqual(
    buildSlotVariablesFromLabels([
      "mardi 10 septembre à 14h30",
      "mercredi 11 septembre à 10h00",
    ]),
    {
      slot_1: "mardi 10 septembre à 14h30",
      slot_2: "mercredi 11 septembre à 10h00",
    },
  );

  assert.deepEqual(
    buildSlotVariablesFromLabels(["mardi 10 septembre à 14h30"]),
    {
      slot_1: "mardi 10 septembre à 14h30",
      slot_2: "un autre créneau",
    },
  );

  assert.deepEqual(buildSlotVariablesFromLabels([]), {
    slot_1: "",
    slot_2: "",
  });

  console.log("OK lib/instantly-bypass/slot-variables.test.ts");
}

main();
