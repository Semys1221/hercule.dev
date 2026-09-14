/** Unit tests for objectifs wizard branching and interpolation. */

import assert from "node:assert/strict";

import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { getSalesQualificationDefaultValues } from "@/lib/admin/funnels/sales-qualification-schema";

import {
  buildWizardChartModel,
  formatGoal6m,
  formatObjectifsWizardInterpolation,
  getImmersiveChartPresence,
  getVisibleWizardQuestionIds,
  getW3Prompt,
  getW4Prompt,
  getW5Prompt,
  getW6Prompt,
  getW7Prompt,
  getWizardChartMetricForQuestion,
  isWizardFieldComplete,
  isWizardStepVisible,
  needsExchangeWhyAfter13,
  needsExchangeWhyAfter15,
  usesObjectifsWizard,
  W17_SYNTHESIS_TEMPLATE,
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
    w10: "y2020",
    w10Year: 2020,
    w12Confirmed: true,
    w13: "no",
    w13Why: "wom_scale",
    w14: "24m",
    w15: "shortcut",
    w16: "strategic",
    w16StrategicSub: "growth",
    w18: "not_acceptable",
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
  assert.match(w4BetterQuality, /traite-t-il par mois/);
  assert.match(getW4Prompt(cifValues, "comptable"), /dossiers le cabinet traite/);

  assert.match(getW3Prompt("cif"), /encours du cabinet/);
  assert.match(getW3Prompt("comptable"), /honoraires annuels du cabinet/i);
  assert.match(getW5Prompt("cif"), /encours le cabinet vise/);
  assert.match(getW6Prompt("cif"), /transformations le cabinet souhaite/);
  assert.match(getW7Prompt(), /clients le cabinet vise/);

  assert.equal(getWizardChartMetricForQuestion("w2"), "clients");
  assert.equal(getWizardChartMetricForQuestion("w3"), "metric");
  assert.equal(getWizardChartMetricForQuestion("w4"), "volume");
  assert.equal(getWizardChartMetricForQuestion("w8"), null);

  assert.equal(isWizardStepVisible("w16", { ...cifValues, w15: "wait", w14: "12m" }), false);
  assert.equal(isWizardStepVisible("w16", { ...cifValues, w15: "shortcut" }), true);
  assert.equal(isWizardStepVisible("w13Why", { ...cifValues, w13: "yes" }), false);
  assert.equal(isWizardStepVisible("wExchangeWhy13", { ...cifValues, w13: "yes" }), true);
  assert.equal(needsExchangeWhyAfter13({ ...cifValues, w13: "yes" }), true);
  assert.equal(
    needsExchangeWhyAfter15({ ...cifValues, w13: "yes", w15: "shortcut", w14: "12m" }),
    true,
  );

  const synthesis = formatObjectifsWizardInterpolation(W17_SYNTHESIS_TEMPLATE, cifValues, "cif");
  assert.match(synthesis, /Bouche-à-oreille/);
  assert.match(synthesis, /mandats/);
  assert.ok(!/lead/i.test(synthesis));

  const goal = formatGoal6m(cifValues, "cif");
  assert.match(goal, /encours/);
  assert.match(goal, /mandats/);

  const visible = getVisibleWizardQuestionIds(cifValues);
  assert.ok(visible.includes("w18"));
  assert.ok(visible.includes("w16"));
  assert.ok(visible.includes("diagnostic_card"));
  assert.equal(visible[0], "w1");
  assert.ok(visible.indexOf("w18") < visible.indexOf("w17"));

  assert.equal(
    isWizardFieldComplete("w13Why", { ...cifValues, w13Why: "invalid_option" }),
    false,
  );
  assert.equal(
    isWizardFieldComplete("w13Why", { ...cifValues, w13Why: "wom_scale" }),
    true,
  );
  assert.equal(
    isWizardFieldComplete("w16Detail", { ...cifValues, w16: "other", w16Detail: "cash_pressure" }),
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

  const comptableDefaults = getSalesQualificationDefaultValues("comptable");
  const w1Only = { ...comptableDefaults, w1: "more_volume" as const };
  const w1Chart = buildWizardChartModel(w1Only, "comptable", "clients");
  assert.equal(w1Chart.showCurrent, false);
  assert.equal(w1Chart.showGoal, false);
  assert.equal(
    w1Chart.data.every((point) => point.statuQuo === null && point.goal === null),
    true,
  );
  assert.equal(getImmersiveChartPresence("w1"), "peek");

  const w2Only = { ...w1Only, w2: 80 };
  const partialChart = buildWizardChartModel(w2Only, "comptable", "clients");
  assert.equal(partialChart.showCurrent, true);
  assert.equal(partialChart.showGoal, false);
  assert.equal(partialChart.data[0]?.statuQuo, 80);
  assert.equal(partialChart.data[0]?.goal, null);
  assert.equal(partialChart.data[1]?.goal, null);

  const fullChart = buildWizardChartModel(
    { ...w2Only, w7: 120 },
    "comptable",
    "clients",
  );
  assert.equal(fullChart.showGoal, true);
  assert.equal(fullChart.data[1]?.goal, 120);

  console.log("OK lib/admin/funnels/sales-objectifs-wizard.test.ts");
}

main();
