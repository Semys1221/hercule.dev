import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  computePipelineMetrics,
  mergePipelineBookings,
  toPipelineBookings,
  type PipelineDashboardMetrics,
} from "@/lib/calendly/pipeline-dashboard";
import { listUpcomingBookings } from "@/lib/calendly/list-bookings";

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "public/email/agence/pipeline/metrics.snapshot.json",
);

const DAYS_BEHIND = 90;
const DAYS_AHEAD = 60;

let cachedMetrics: PipelineDashboardMetrics | null = null;

export async function loadPipelineMetricsSnapshot(): Promise<PipelineDashboardMetrics> {
  if (cachedMetrics && loadedSnapshotVersion === SNAPSHOT_VERSION) {
    return cachedMetrics;
  }
  const raw = await readFile(SNAPSHOT_PATH, "utf8");
  const metrics = JSON.parse(raw) as PipelineDashboardMetrics;
  cachedMetrics = metrics;
  loadedSnapshotVersion = SNAPSHOT_VERSION;
  return metrics;
}

export function clearPipelineMetricsCache(): void {
  cachedMetrics = null;
}

/** Bump when snapshot semantics change — forces re-read from disk. */
const SNAPSHOT_VERSION = 2;
let loadedSnapshotVersion = 0;

export async function loadLivePipelineMetrics(
  now: Date = new Date(),
): Promise<PipelineDashboardMetrics> {
  const [comptableRows, cifRows] = await Promise.all([
    listUpcomingBookings({
      niche: "comptable",
      daysBehind: DAYS_BEHIND,
      daysAhead: DAYS_AHEAD,
      now,
    }),
    listUpcomingBookings({
      niche: "cif",
      daysBehind: DAYS_BEHIND,
      daysAhead: DAYS_AHEAD,
      now,
    }),
  ]);

  const bookings = mergePipelineBookings(
    toPipelineBookings(comptableRows, "comptable", now),
    toPipelineBookings(cifRows, "cif", now),
  );

  return computePipelineMetrics(bookings, now);
}

/**
 * Admin UI metrics — snapshot + in-process cache (no live Calendly).
 * Use `loadLivePipelineMetrics` from scripts when refreshing the snapshot file.
 */
export async function loadPipelineMetrics(
  options: { offline?: boolean; now?: Date; live?: boolean } = {},
): Promise<PipelineDashboardMetrics> {
  if (cachedMetrics && !options.live) {
    return cachedMetrics;
  }

  if (
    options.live &&
    !options.offline &&
    process.env.PIPELINE_METRICS_OFFLINE !== "1"
  ) {
    const metrics = await loadLivePipelineMetrics(options.now);
    cachedMetrics = metrics;
    return metrics;
  }

  return loadPipelineMetricsSnapshot();
}
