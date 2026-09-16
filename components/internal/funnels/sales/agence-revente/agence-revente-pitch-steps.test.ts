/** Unit tests for agence revente pitch steps helpers. */

import assert from "node:assert/strict";

import type { PipelineDashboardMetrics } from "@/lib/calendly/pipeline-dashboard";
import { computePipelineStockPotentialCa } from "@/lib/calendly/pipeline-roi-calculator";

import {
  buildCapaciteRevealBlocks,
  formatPitchWelcomeName,
  getVisibleCapaciteBlocks,
  getVisibleProduitBlocks,
  sumLastDailyHistory,
} from "./agence-revente-pitch-steps";

const sampleMetrics: PipelineDashboardMetrics = {
  generatedAt: "2026-09-15T12:00:00.000Z",
  activeCount: 54,
  pastCount: 20,
  upcomingCount: 25,
  pipelineLifetimeDays: 14,
  firstStartTime: "2026-09-01T08:00:00.000Z",
  lastStartTime: "2026-09-15T17:00:00.000Z",
  rdvPerCalendarDay: 3.86,
  rdvPerActiveDay: 3.9,
  activeDays: 14,
  calendarDays: 14,
  prediction30Days: 117,
  prediction22BusinessDays: 85,
  closingHours: 27,
  caPotentielEur: 16200,
  revenuePerHourEur: 600,
  segmentAggregates: [],
  highlighted: {
    budgetUndefined: 37,
    budget1000PlusIndependent: 7,
    notIndependentComptable: 15,
    notComptable: 38,
  },
  dailyHistory: [
    { date: "2026-09-08", count: 3 },
    { date: "2026-09-09", count: 4 },
    { date: "2026-09-10", count: 5 },
    { date: "2026-09-11", count: 4 },
    { date: "2026-09-12", count: 3 },
    { date: "2026-09-15", count: 4 },
  ],
};

assert.equal(formatPitchWelcomeName(""), "");
assert.equal(formatPitchWelcomeName("  "), "");
assert.equal(formatPitchWelcomeName("Indépendant"), "");
assert.equal(formatPitchWelcomeName("independant"), "");
assert.equal(formatPitchWelcomeName("Cabinet Dupont"), "Cabinet Dupont");

assert.equal(sumLastDailyHistory(sampleMetrics, 10), 23);

const capaciteBlocks = buildCapaciteRevealBlocks();
assert.equal(capaciteBlocks.length, 5);
assert.equal(getVisibleCapaciteBlocks(0).length, 1);
assert.equal(getVisibleCapaciteBlocks(0)[0]?.type, "pipeline_rhythm");
assert.equal(getVisibleCapaciteBlocks(1).length, 2);
assert.equal(getVisibleCapaciteBlocks(1)[0]?.type, "pipeline_rhythm");
assert.equal(getVisibleCapaciteBlocks(1)[1]?.type, "roi_monthly");
assert.equal(getVisibleCapaciteBlocks(99).length, 5);

const produitBlocks = getVisibleProduitBlocks(sampleMetrics, 0);
assert.equal(produitBlocks.length, 1);
assert.equal(produitBlocks[0]?.type, "business_model_intro");

const produitStack = getVisibleProduitBlocks(sampleMetrics, 2);
assert.equal(produitStack.length, 3);
assert.equal(produitStack[2]?.type, "business_model_step");

const stockKpi = getVisibleProduitBlocks(sampleMetrics, 7).at(-1);
assert.equal(stockKpi?.type, "kpi_bars");
assert.equal(
  stockKpi && stockKpi.type === "kpi_bars" ? stockKpi.rows[0]?.value : null,
  25,
);

assert.equal(
  computePipelineStockPotentialCa({
    upcomingCount: 25,
    basketEur: 1500,
    closingRatePercent: 20,
  }),
  7500,
);

console.log("OK components/internal/funnels/sales/agence-revente/agence-revente-pitch-steps.test.ts");
