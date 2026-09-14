import { isTransientBypassError } from "@/lib/instantly-bypass/transient-errors";

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 750;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withMarketingFetchFallback<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  let lastMessage = "unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      lastMessage = error instanceof Error ? error.message : String(error);
      const canRetry =
        attempt < MAX_ATTEMPTS && isTransientBypassError(lastMessage);
      if (!canRetry) {
        break;
      }
      await sleep(RETRY_BASE_MS * attempt);
    }
  }

  console.warn(
    `[marketing] ${label} failed after ${MAX_ATTEMPTS} attempt(s), using fallback: ${lastMessage}`,
  );
  return fallback;
}
