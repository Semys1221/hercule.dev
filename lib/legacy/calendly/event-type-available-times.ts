import { getCalendlyApiToken } from "@/lib/legacy/calendly";

const CALENDLY_API = "https://api.calendly.com";

export async function nextAvailableEventTypeStartTime(
  eventTypeUri: string,
  now: Date = new Date(),
): Promise<string | null> {
  const token = getCalendlyApiToken();
  const start = new Date(now.getTime() + 60_000);
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    event_type: eventTypeUri,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });

  const response = await fetch(
    `${CALENDLY_API}/event_type_available_times?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `Calendly available times HTTP ${response.status}: ${body}`,
    );
  }

  const data = JSON.parse(body) as {
    collection?: Array<{ start_time?: string; status?: string }>;
  };
  const slots = (data.collection ?? [])
    .filter((slot) => slot.status !== "unavailable")
    .map((slot) => String(slot.start_time ?? "").trim())
    .filter(Boolean)
    .sort();
  return slots[0] ?? null;
}
