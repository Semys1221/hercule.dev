/** Verify Calendly meeting action links resolve with live API data. */

import {
  getScheduledEventInvitee,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";

const CALENDLY_API = "https://api.calendly.com";

function token(): string {
  const value = process.env.CALENDLY_API_TOKEN?.trim();
  if (!value) {
    throw new Error("CALENDLY_API_TOKEN is not set");
  }
  return value;
}

async function calendlyGet(path: string, params?: Record<string, string>) {
  const url = new URL(`${CALENDLY_API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!response.ok) {
    throw new Error(`${path} HTTP ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

async function headCheck(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
    });
    if (response.status >= 200 && response.status < 400) {
      return `ok:${response.status}`;
    }
    if (response.status >= 300 && response.status < 400) {
      return `redirect:${response.status}`;
    }
    return `fail:${response.status}`;
  } catch (err) {
    return `error:${err instanceof Error ? err.message : String(err)}`;
  }
}

async function verifySupabaseLeads() {
  const { createLinkTrackingClient } = await import("@/lib/link-tracking/supabase");
  const { resolveMeetingActionLinks, resolveUuidsFromLead } = await import(
    "@/lib/booking-communication/meeting-links"
  );

  const client = createLinkTrackingClient();
  let checked = 0;
  let missingUri = 0;
  let missingLinks = 0;

  for (const table of ["agence", "entreprise"] as const) {
    const { data, error } = await client
      .from(table)
      .select("id,email,statut,calendly_invitee_uri,scheduled_at")
      .in("statut", ["MEETING_BOOKED", "CONFIRMED", "BOOKED"])
      .order("scheduled_at", { ascending: true })
      .limit(8);

    if (error) {
      throw new Error(error.message);
    }

    console.log(`\nSupabase ${table}: ${data?.length ?? 0} booked lead(s)`);

    for (const lead of data ?? []) {
      checked += 1;
      const hasUri = Boolean(lead.calendly_invitee_uri?.trim());
      if (!hasUri) missingUri += 1;

      const uuids = resolveUuidsFromLead(lead);
      const links = uuids ? await resolveMeetingActionLinks(lead) : null;
      if (!links) missingLinks += 1;

      console.log("---");
      console.log(`${lead.email} (${lead.statut})`);
      console.log(`invitee_uri: ${hasUri ? "yes" : "NO"}`);
      console.log(`uuids: ${uuids ? "ok" : "missing"}`);
      console.log(
        `links: join=${Boolean(links?.joinUrl)} reschedule=${Boolean(links?.rescheduleUrl)} cancel=${Boolean(links?.cancelUrl)}`,
      );
    }
  }

  console.log("\nSupabase summary:");
  console.log(
    `checked=${checked} missing_invitee_uri=${missingUri} missing_any_link=${missingLinks}`,
  );
}

async function main() {
  await verifyCalendlyApi();
  await verifySupabaseLeads();
}

async function verifyCalendlyApi() {
  const me = await calendlyGet("/users/me");
  const userUri = String((me.resource as Record<string, unknown>)?.uri ?? "");
  if (!userUri) {
    throw new Error("No Calendly user uri");
  }

  const now = new Date();
  const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const eventsPayload = await calendlyGet("/scheduled_events", {
    user: userUri,
    status: "active",
    min_start_time: now.toISOString(),
    max_start_time: max.toISOString(),
    count: "5",
  });

  const events = (eventsPayload.collection as Record<string, unknown>[]) ?? [];
  if (events.length === 0) {
    console.log("No upcoming active events in the next 30 days.");
    return;
  }

  let checked = 0;
  let withJoin = 0;
  let missingJoin = 0;

  for (const event of events.slice(0, 5)) {
    const eventUri = String(event.uri ?? "");
    const eventUuid = eventUri.split("/").pop() ?? "";
    const location = event.location as Record<string, unknown> | undefined;
    const locationType = String(location?.type ?? "unknown");
    const eventJoinUrl = String(location?.join_url ?? "").trim();

    const inviteesPayload = await calendlyGet(
      `/scheduled_events/${eventUuid}/invitees`,
      { count: "3" },
    );
    const invitees =
      (inviteesPayload.collection as Record<string, unknown>[]) ?? [];

    for (const invitee of invitees.slice(0, 2)) {
      const inviteeUri = String(invitee.uri ?? "");
      const parsed = parseEventAndInviteeUuids(inviteeUri);
      if (!parsed) {
        console.log(`SKIP invalid invitee uri: ${inviteeUri}`);
        continue;
      }

      const links = await getScheduledEventInvitee(
        parsed.eventUuid,
        parsed.inviteeUuid,
      );
      checked += 1;

      const joinPresent = Boolean(links.joinUrl);
      if (joinPresent) withJoin += 1;
      else missingJoin += 1;

      const cancelCheck = await headCheck(links.cancelUrl);
      const rescheduleCheck = await headCheck(links.rescheduleUrl);
      const joinCheck = links.joinUrl ? await headCheck(links.joinUrl) : "n/a";

      console.log("---");
      console.log(`email: ${String(invitee.email ?? "")}`);
      console.log(`event_start: ${String(event.start_time ?? "")}`);
      console.log(`location_type: ${locationType}`);
      console.log(`event_join_url_present: ${Boolean(eventJoinUrl)}`);
      console.log(`invitee_status: ${links.status}`);
      console.log(`cancel_url: ${links.cancelUrl}`);
      console.log(`reschedule_url: ${links.rescheduleUrl}`);
      console.log(`join_url: ${links.joinUrl ?? "(missing)"}`);
      console.log(
        `http_checks cancel=${cancelCheck} reschedule=${rescheduleCheck} join=${joinCheck}`,
      );
    }
  }

  console.log("---");
  console.log(
    `summary checked=${checked} with_join=${withJoin} missing_join=${missingJoin}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
