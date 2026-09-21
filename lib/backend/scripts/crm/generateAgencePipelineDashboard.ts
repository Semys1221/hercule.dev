import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadLivePipelineMetrics, loadPipelineMetricsSnapshot } from "@/lib/legacy/calendly/load-pipeline-metrics";

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "public/email/agence/pipeline/metrics.snapshot.json",
);

const offlineMode = process.argv.includes("--offline");

async function main(): Promise<void> {
  const metrics = offlineMode
    ? await loadPipelineMetricsSnapshot()
    : await loadLivePipelineMetrics();

  await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, `${JSON.stringify(metrics, null, 2)}\n`, "utf8");

  console.log(
    `Pipeline metrics snapshot written to ${SNAPSHOT_PATH}${offlineMode ? " (offline read)" : ""}`,
  );
  console.log(
    JSON.stringify(
      {
        activeCount: metrics.activeCount,
        upcomingCount: metrics.upcomingCount,
        prediction30Days: metrics.prediction30Days,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
