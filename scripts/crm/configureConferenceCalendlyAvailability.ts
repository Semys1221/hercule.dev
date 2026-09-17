/**
 * Restrict hercule-briefing-dec-cif to CONFERENCE_COHORT_SESSION (single date).
 *
 * Usage:
 *   pnpm configure-conference-calendly-availability --dry-run
 *   pnpm configure-conference-calendly-availability
 */
import {
  CIF_CONFERENCE_CALENDLY_URL,
  CONFERENCE_COHORT_SESSION,
} from "@/lib/cif-conference-sequence/constants";
import { getCalendlyApiToken } from "@/lib/calendly";

const CALENDLY_API_BASE = "https://api.calendly.com";

type AvailabilityRule = {
  type: "date" | "wday";
  date?: string;
  wday?: string;
  intervals: Array<{ from: string; to: string }>;
};

async function calendlyRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getCalendlyApiToken();
  const response = await fetch(`${CALENDLY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Calendly ${response.status} on ${path}: ${text}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function normalizeSchedulingUrl(url: string): string {
  return url.trim().replace(/\/$/, "").toLowerCase();
}

async function resolveEventTypeUri(schedulingUrl: string): Promise<string> {
  const me = await calendlyRequest<{ resource?: { uri?: string } }>(
    "/users/me",
  );
  const userUri = me.resource?.uri?.trim();
  if (!userUri) {
    throw new Error("Calendly /users/me returned no user URI");
  }

  const target = normalizeSchedulingUrl(schedulingUrl);
  let pageToken = "";

  while (true) {
    const params = new URLSearchParams({
      user: userUri,
      active: "true",
      count: "100",
    });
    if (pageToken) {
      params.set("page_token", pageToken);
    }

    const payload = await calendlyRequest<{
      collection?: Array<{ uri?: string; scheduling_url?: string }>;
      pagination?: { next_page_token?: string };
    }>(`/event_types?${params.toString()}`);

    const match = (payload.collection ?? []).find(
      (eventType) =>
        normalizeSchedulingUrl(String(eventType.scheduling_url ?? "")) ===
        target,
    );
    const uri = match?.uri?.trim();
    if (uri) {
      return uri;
    }

    pageToken = payload.pagination?.next_page_token?.trim() ?? "";
    if (!pageToken) {
      break;
    }
  }

  throw new Error(`No Calendly event type found for ${schedulingUrl}`);
}

async function getEventTypeDurationMinutes(eventTypeUri: string): Promise<number> {
  const uuid = eventTypeUri.split("/").pop() ?? "";
  const payload = await calendlyRequest<{
    resource?: { duration?: number };
  }>(`/event_types/${uuid}`);
  const duration = payload.resource?.duration;
  if (typeof duration === "number" && duration > 0) {
    return duration;
  }
  return 30;
}

function intervalToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToInterval(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildSessionInterval(durationMinutes: number): {
  from: string;
  to: string;
} {
  const from = CONFERENCE_COHORT_SESSION.intervalFrom;
  const to =
    durationMinutes === 30
      ? CONFERENCE_COHORT_SESSION.intervalTo
      : minutesToInterval(intervalToMinutes(from) + durationMinutes);
  return { from, to };
}

async function listAvailableSlots(
  eventTypeUri: string,
  start: Date,
  end: Date,
): Promise<string[]> {
  const params = new URLSearchParams({
    event_type: eventTypeUri,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });
  const payload = await calendlyRequest<{
    collection?: Array<{ start_time?: string }>;
  }>(`/event_type_available_times?${params.toString()}`);
  return (payload.collection ?? [])
    .map((slot) => slot.start_time?.trim() ?? "")
    .filter(Boolean);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const eventTypeUri = await resolveEventTypeUri(CIF_CONFERENCE_CALENDLY_URL);
  const durationMinutes = await getEventTypeDurationMinutes(eventTypeUri);
  const interval = buildSessionInterval(durationMinutes);

  const rules: AvailabilityRule[] = [
    {
      type: "date",
      date: CONFERENCE_COHORT_SESSION.date,
      intervals: [interval],
    },
  ];

  const patchBody = {
    event_type: eventTypeUri,
    availability_setting: "host",
    availability_rule: {
      timezone: CONFERENCE_COHORT_SESSION.timezone,
      rules,
    },
  };

  console.log("Event type:", eventTypeUri);
  console.log("Scheduling URL:", CIF_CONFERENCE_CALENDLY_URL);
  console.log("Session:", CONFERENCE_COHORT_SESSION.labelFrShort, interval);

  if (dryRun) {
    console.log("\n[dry-run] PATCH /event_type_availability_schedules");
    console.log(JSON.stringify(patchBody, null, 2));
    return;
  }

  await calendlyRequest("/event_type_availability_schedules", {
    method: "PATCH",
    body: JSON.stringify(patchBody),
  });

  const windowStart = new Date(`${CONFERENCE_COHORT_SESSION.date}T00:00:00Z`);
  const windowEnd = new Date(`${CONFERENCE_COHORT_SESSION.date}T23:59:59Z`);
  const slots = await listAvailableSlots(eventTypeUri, windowStart, windowEnd);

  console.log(`\nAvailable slots on ${CONFERENCE_COHORT_SESSION.date}:`, slots);
  if (slots.length !== 1) {
    throw new Error(
      `Expected exactly 1 bookable slot, got ${slots.length}: ${slots.join(", ")}`,
    );
  }

  console.log("Conference Calendly availability updated successfully.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
