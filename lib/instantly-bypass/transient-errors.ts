const TRANSIENT_ERROR_PATTERNS = [
  /gateway timeout/i,
  /fetch failed/i,
  /timed out/i,
  /\b502\b/,
  /\b503\b/,
  /\b504\b/,
  /econnreset/i,
  /enotfound/i,
  /socket hang up/i,
] as const;

export const MAX_BYPASS_JOB_RETRIES = 5;

export function isTransientBypassError(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(text));
}

export function retryBackoffMs(retryCount: number): number {
  const capped = Math.min(Math.max(retryCount, 1), MAX_BYPASS_JOB_RETRIES);
  return Math.min(60_000 * capped, 15 * 60_000);
}

export function retryCountFromPayload(
  payload: Record<string, unknown> | null | undefined,
): number {
  const count = payload?.retry_count;
  return typeof count === "number" && Number.isFinite(count) && count > 0
    ? Math.floor(count)
    : 0;
}
