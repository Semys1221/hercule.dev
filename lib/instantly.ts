const INSTANTLY_API_BASE = "https://api.instantly.ai/api/v2";
const MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function instantlyFetch<T>(
  apiKey: string,
  endpoint: string,
  init?: RequestInit,
  attempt = 0,
): Promise<T> {
  const response = await fetch(`${INSTANTLY_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfterSeconds = retryAfterHeader
      ? Number.parseInt(retryAfterHeader, 10)
      : 65;
    const waitMs = Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds * 1000
      : 65000;
    console.warn(
      `Rate limited on ${endpoint}. Retrying in ${Math.ceil(waitMs / 1000)}s...`,
    );
    await sleep(waitMs);
    return instantlyFetch<T>(apiKey, endpoint, init, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(
      `Instantly API ${response.status} on ${endpoint}: ${typeof data === "string" ? data : JSON.stringify(data)}`,
    );
  }

  return data as T;
}

export type UpdateLeadInterestStatusParams = {
  lead_email: string;
  interest_value: number | null;
  campaign_id?: string;
  list_id?: string;
};

/** Native Instantly interest status update (202 Accepted). interest_value 2 = Meeting Booked. */
export async function updateLeadInterestStatus(
  apiKey: string,
  params: UpdateLeadInterestStatusParams,
): Promise<unknown> {
  return instantlyFetch(apiKey, "/leads/update-interest-status", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function patchLeadCustomVariables(
  apiKey: string,
  leadId: string,
  customVariables: Record<string, string | number | boolean | null>,
): Promise<unknown> {
  return instantlyFetch(apiKey, `/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ custom_variables: customVariables }),
  });
}
