import type { PipelineDashboardMetrics } from "@/lib/legacy/calendly/pipeline-dashboard";

export type PipelineMetricsClientPayload = {
  metrics: PipelineDashboardMetrics;
  product: {
    name: string;
    priceEur: number;
    paymentLinkUrl: string;
  };
};

const STORAGE_KEY = "hercule:pipeline-metrics:v3";

let memoryCache: PipelineMetricsClientPayload | null = null;

export function readCachedPipelineMetrics(): PipelineMetricsClientPayload | null {
  if (memoryCache) {
    return memoryCache;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PipelineMetricsClientPayload;
    memoryCache = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedPipelineMetrics(
  payload: PipelineMetricsClientPayload,
): void {
  memoryCache = payload;
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}
