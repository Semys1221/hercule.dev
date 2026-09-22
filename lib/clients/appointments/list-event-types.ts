import { getCalendlyApiToken } from "@/lib/legacy/calendly";

const CALENDLY_API_BASE = "https://api.calendly.com";

export type CalendlyEventTypeOption = {
  uri: string;
  name: string;
  schedulingUrl: string;
};

async function calendlyGet<T>(path: string): Promise<T> {
  const token = getCalendlyApiToken();
  const response = await fetch(`${CALENDLY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly ${response.status}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function listAccountEventTypes(): Promise<CalendlyEventTypeOption[]> {
  const me = await calendlyGet<{ resource?: { uri?: string } }>("/users/me");
  const userUri = me.resource?.uri?.trim();
  if (!userUri) {
    throw new Error("Calendly /users/me returned no user URI");
  }

  const options: CalendlyEventTypeOption[] = [];
  let pageToken = "";

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      user: userUri,
      active: "true",
      count: "100",
    });
    if (pageToken) params.set("page_token", pageToken);

    const payload = await calendlyGet<{
      collection?: Array<{
        uri?: string;
        name?: string;
        scheduling_url?: string;
      }>;
      pagination?: { next_page_token?: string };
    }>(`/event_types?${params.toString()}`);

    for (const eventType of payload.collection ?? []) {
      const uri = eventType.uri?.trim() ?? "";
      const schedulingUrl = eventType.scheduling_url?.trim() ?? "";
      if (!uri || !schedulingUrl) continue;
      options.push({
        uri,
        name: eventType.name?.trim() || schedulingUrl,
        schedulingUrl,
      });
    }

    pageToken = payload.pagination?.next_page_token?.trim() ?? "";
    if (!pageToken) break;
  }

  return options;
}
