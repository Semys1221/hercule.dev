import { getCalendlyApiToken } from "@/lib/calendly";

const CALENDLY_API_BASE = "https://api.calendly.com";

export type CalendlyEventTypeOption = {
  uri: string;
  name: string;
  scheduling_url: string | null;
  active: boolean;
};

async function calendlyGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = getCalendlyApiToken();
  const url = new URL(`${CALENDLY_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly ${response.status} on ${path}: ${text}`);
  }

  return JSON.parse(text) as T;
}

async function listEventTypesForUser(userUri: string): Promise<CalendlyEventTypeOption[]> {
  const items: CalendlyEventTypeOption[] = [];
  let pageToken = "";

  while (true) {
    const params: Record<string, string> = {
      user: userUri,
      active: "true",
      count: "100",
    };
    if (pageToken) {
      params.page_token = pageToken;
    }

    const payload = await calendlyGet<{
      collection?: Array<{
        uri?: string;
        name?: string;
        scheduling_url?: string;
        active?: boolean;
      }>;
      pagination?: { next_page_token?: string };
    }>("/event_types", params);

    for (const row of payload.collection ?? []) {
      const uri = row.uri?.trim();
      if (!uri) {
        continue;
      }
      items.push({
        uri,
        name: row.name?.trim() || uri,
        scheduling_url: row.scheduling_url?.trim() || null,
        active: row.active !== false,
      });
    }

    pageToken = payload.pagination?.next_page_token?.trim() ?? "";
    if (!pageToken) {
      break;
    }
  }

  return items;
}

export async function listCalendlyEventTypes(): Promise<CalendlyEventTypeOption[]> {
  const me = await calendlyGet<{ resource?: { uri?: string } }>("/users/me");
  const userUri = me.resource?.uri?.trim();
  if (!userUri) {
    throw new Error("Calendly /users/me returned no user URI");
  }

  return listEventTypesForUser(userUri);
}
