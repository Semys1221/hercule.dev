/** Unit tests for pipeline metrics loader (offline snapshot). */

import assert from "node:assert/strict";

import { loadPipelineMetricsSnapshot } from "@/lib/legacy/calendly/load-pipeline-metrics";

async function main(): Promise<void> {
  const metrics = await loadPipelineMetricsSnapshot();

  assert.equal(typeof metrics.activeCount, "number");
  assert.equal(typeof metrics.upcomingCount, "number");
  assert.equal(typeof metrics.prediction30Days, "number");
  assert.ok(Array.isArray(metrics.segmentAggregates));
  assert.ok(typeof metrics.highlighted.budgetUndefined === "number");

  console.log("OK lib/calendly/load-pipeline-metrics.test.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
