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

export type InstantlyListLead = {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  custom_variables?: Record<string, unknown>;
};

type LeadsListPage = {
  items?: InstantlyListLead[];
  next_starting_after?: string;
};

export function getInstantlyApiKey(): string {
  const key = process.env.INSTANTLY_API_KEY?.trim();
  if (!key) {
    throw new Error("INSTANTLY_API_KEY is not set");
  }
  return key;
}

export async function fetchLeadsFromList(
  apiKey: string,
  listId: string,
  options: { maxLeads?: number | null; maxPages?: number } = {},
): Promise<InstantlyListLead[]> {
  const maxLeads = options.maxLeads ?? null;
  const maxPages = options.maxPages ?? 100;
  const leads: InstantlyListLead[] = [];
  let startingAfter: string | null = null;
  let pages = 0;

  while (pages < maxPages) {
    pages += 1;
    const body: Record<string, unknown> = {
      list_id: listId.trim(),
      limit: 100,
    };
    if (startingAfter) {
      body.starting_after = startingAfter;
    }

    const page = await instantlyFetch<LeadsListPage>(apiKey, "/leads/list", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const items = page.items ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      leads.push(item);
      if (maxLeads !== null && leads.length >= maxLeads) {
        return leads.slice(0, maxLeads);
      }
    }

    const next =
      page.next_starting_after ??
      (items.length > 0 ? items[items.length - 1]?.id ?? null : null);
    if (!next || items.length < 100) break;
    startingAfter = next;
  }

  return leads;
}

export async function fetchLeadsFromCampaign(
  apiKey: string,
  campaignId: string,
  options: { maxLeads?: number | null; maxPages?: number } = {},
): Promise<InstantlyListLead[]> {
  const maxLeads = options.maxLeads ?? null;
  const maxPages = options.maxPages ?? 100;
  const leads: InstantlyListLead[] = [];
  let startingAfter: string | null = null;
  let pages = 0;

  while (pages < maxPages) {
    pages += 1;
    const body: Record<string, unknown> = {
      campaign: campaignId.trim(),
      limit: 100,
    };
    if (startingAfter) {
      body.starting_after = startingAfter;
    }

    const page = await instantlyFetch<LeadsListPage>(apiKey, "/leads/list", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const items = page.items ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      leads.push(item);
      if (maxLeads !== null && leads.length >= maxLeads) {
        return leads.slice(0, maxLeads);
      }
    }

    const next =
      page.next_starting_after ??
      (items.length > 0 ? items[items.length - 1]?.id ?? null : null);
    if (!next || items.length < 100) break;
    startingAfter = next;
  }

  return leads;
}

export async function patchLeadsCustomVariablesParallel(
  apiKey: string,
  items: Array<{ leadId: string; customVariables: Record<string, string> }>,
  maxConcurrency = 8,
): Promise<{ patched: number; failed: number; errors: string[] }> {
  if (items.length === 0) {
    return { patched: 0, failed: 0, errors: [] };
  }

  const workers = Math.max(1, Math.min(maxConcurrency, items.length, 16));
  let patched = 0;
  let failed = 0;
  const errors: string[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (!current) continue;
      try {
        await patchLeadCustomVariables(
          apiKey,
          current.leadId,
          current.customVariables,
        );
        patched += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Instantly PATCH failed for ${current.leadId}: ${message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return { patched, failed, errors };
}
