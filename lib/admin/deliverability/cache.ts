import type { DeliverabilitySnapshot } from "@/lib/admin/deliverability/types";

type SnapshotCacheEntry = {
  fetchedAt: number;
  snapshot: DeliverabilitySnapshot;
  vitalsIncluded: boolean;
};

let cache: SnapshotCacheEntry | null = null;

export function getCachedSnapshot(
  refreshMinutes: number,
  forceRefresh: boolean,
  requireVitals: boolean,
): DeliverabilitySnapshot | null {
  if (!cache || forceRefresh) return null;

  const ttlMs = Math.max(1, refreshMinutes) * 60 * 1000;
  const isFresh = Date.now() - cache.fetchedAt < ttlMs;
  if (!isFresh) return null;

  if (requireVitals && !cache.vitalsIncluded) return null;

  return {
    ...cache.snapshot,
    cached: true,
  };
}

export function setCachedSnapshot(
  snapshot: DeliverabilitySnapshot,
  vitalsIncluded: boolean,
): void {
  cache = {
    fetchedAt: Date.now(),
    snapshot,
    vitalsIncluded,
  };
}

export function invalidateDeliverabilityCache(): void {
  cache = null;
}
