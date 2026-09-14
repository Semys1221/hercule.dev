/** Unit tests for objectifs wizard branching and interpolation. */

import assert from "node:assert/strict";

import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { getSalesQualificationDefaultValues } from "@/lib/admin/funnels/sales-qualification-schema";

import {
  buildWizardChartModel,
  formatGoal6m,
  formatObjectifsWizardInterpolation,
  getVisibleWizardQuestionIds,
  getW4Prompt,
  getW6Prompt,
  getW7Prompt,
  getWizardChartMetricForQuestion,
  isWizardFieldComplete,
  isWizardStepVisible,
  usesObjectifsWizard,
  W9_TRAP_TEMPLATE,
} from "./sales-objectifs-wizard";

function baseWizardValues(audience: "cif" | "comptable"): SalesQualificationValues {
  const defaults = getSalesQualificationDefaultValues(audience);
  return {
    ...defaults,
    w1: "more_volume",
    w2: 80,
    w3: audience === "cif" ? 15_000_000 : 400_000,
    w4: 2,
    w5: audience === "cif" ? 25_000_000 : 600_000,
    w6: 5,
    w7: 120,
    w8: "word_of_mouth",
    w8Tried: "looked",
    w8TriedWho: "Agence SEO locale",
    w8Criteria: ["predictable_flow", "zone_typology"],
    w8Brake: "wom_scale",
    w9Acknowledged: true,
    w10: "y2020",
    w10Year: 2020,
    w11: "1-3y",
    w12Confirmed: true,
    w13: "no",
    w13Why: "Le bouche-à-oreille ne scale pas sur la zone visée.",
    w14: "24m",
    w15: "shortcut",
    w16: "strategic",
    w18: "significant_gap",
    w17Acknowledged: true,
    bleedDiagnosticAccepted: true,
  };
}

function main() {
  const cifValues = baseWizardValues("cif");

  assert.equal(usesObjectifsWizard(cifValues), true);

  const w4BetterQuality = getW4Prompt({ ...cifValues, w1: "better_quality" }, "cif");
  const w4MoreVolume = getW4Prompt({ ...cifValues, w1: "more_volume" }, "cif");
  assert.equal(w4BetterQuality, w4MoreVolume);
  assert.match(w4BetterQuality, /qui vous conviennent/);
  assert.match(getW4Prompt(cifValues, "comptable"), /dossiers qui vous conviennent/);

  assert.match(getW6Prompt("cif"), /transformations qui vous conviennent/);
  assert.match(getW7Prompt(), /clients dans 6 mois/);

  assert.equal(getWizardChartMetricForQuestion("w2"), "clients");
  assert.equal(getWizardChartMetricForQuestion("w3"), "metric");
  assert.equal(getWizardChartMetricForQuestion("w4"), "volume");
  assert.equal(getWizardChartMetricForQuestion("w8"), null);

  assert.equal(isWizardStepVisible("w16", { ...cifValues, w15: "wait", w14: "12m" }), false);
  assert.equal(isWizardStepVisible("w16", { ...cifValues, w15: "shortcut" }), true);
  assert.equal(isWizardStepVisible("w16", { ...cifValues, w15: "wait", w14: "24m" }), true);
  assert.equal(isWizardStepVisible("w16Detail", { ...cifValues, w16: "other" }), true);
  assert.equal(isWizardStepVisible("w16Detail", { ...cifValues, w16: "strategic" }), false);
  assert.equal(isWizardStepVisible("w8TriedWho", { ...cifValues, w8Tried: "none" }), false);
  assert.equal(isWizardStepVisible("w8TriedWho", { ...cifValues, w8Tried: "looked" }), true);

  const trap = formatObjectifsWizardInterpolation(W9_TRAP_TEMPLATE, cifValues, "cif");
  assert.match(trap, /Bouche-à-oreille/);
  assert.match(trap, /mandats/);
  assert.ok(!/lead/i.test(trap));

  const goal = formatGoal6m(cifValues, "cif");
  assert.match(goal, /encours/);
  assert.match(goal, /mandats/);

  const visible = getVisibleWizardQuestionIds(cifValues);
  assert.ok(visible.includes("w8Brake"));
  assert.ok(visible.includes("w18"));
  assert.ok(visible.includes("w16"));
  assert.ok(visible.includes("diagnostic_card"));
  assert.equal(visible[0], "w1");
  assert.ok(visible.indexOf("w18") < visible.indexOf("w17"));

  assert.equal(isWizardFieldComplete("w8Criteria", { ...cifValues, w8Criteria: [] }), false);
  assert.equal(isWizardFieldComplete("w8Criteria", cifValues), true);
  assert.equal(
    isWizardFieldComplete("w8TriedWho", { ...cifValues, w8Tried: "none" }),
    true,
  );
  assert.equal(
    isWizardFieldComplete("w2", { ...cifValues, w2: 80 }, { touchedSliderFields: new Set() }),
    false,
  );
  assert.equal(
    isWizardFieldComplete("w2", { ...cifValues, w2: 80 }, { touchedSliderFields: new Set(["w2"]) }),
    true,
  );

  const chart = buildWizardChartModel(cifValues, "cif", "volume");
  assert.equal(chart.showCurrent, true);
  assert.equal(chart.showGoal, true);
  assert.equal(chart.data.length, 3);
  assert.equal(chart.data[1]?.goal, 5);
  assert.equal(chart.data[2]?.goal, 8);
  assert.match(chart.gapLabel, /mandats/);
  assert.match(chart.hint, /12 mois/);

  console.log("OK lib/admin/funnels/sales-objectifs-wizard.test.ts");
}

main();
