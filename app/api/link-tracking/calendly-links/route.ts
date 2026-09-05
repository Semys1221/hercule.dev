import { NextResponse } from "next/server";

import {
  getScheduledEventInvitee,
  parseEventAndInviteeUuids,
} from "@/lib/calendly";
import { resolveUuidsFromLead } from "@/lib/booking-communication/meeting-links";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";

function resolveUuidsFromSearchParams(searchParams: URLSearchParams): {
  eventUuid: string;
  inviteeUuid: string;
} | null {
  const eventUri = searchParams.get("eventUri")?.trim() ?? "";
  const inviteeUri = searchParams.get("inviteeUri")?.trim() ?? "";

  if (inviteeUri) {
    const parsed = parseEventAndInviteeUuids(inviteeUri);
    if (parsed) return parsed;
  }

  if (eventUri && inviteeUri) {
    const eventUuid = eventUri.split("/").pop() ?? "";
    const inviteeUuid = inviteeUri.split("/").pop() ?? "";
    if (eventUuid && inviteeUuid) {
      return { eventUuid, inviteeUuid };
    }
  }

  return null;
}

async function resolveUuidsFromLeadLookup(
  slug: string,
  email: string,
): Promise<{ eventUuid: string; inviteeUuid: string } | null> {
  const client = createLinkTrackingClient();
  let lookup = slug ? await findLeadByLink(client, slug) : null;
  if (!lookup && email) {
    lookup = await findLeadByEmail(client, email);
  }
  if (!lookup) return null;

  return resolveUuidsFromLead(lookup.lead);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("code") ?? searchParams.get("slug") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

  let uuids = resolveUuidsFromSearchParams(searchParams);
  if (!uuids && (slug || email)) {
    try {
      uuids = await resolveUuidsFromLeadLookup(slug, email);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ ok: false, reason: message }, { status: 500 });
    }
  }

  if (!uuids) {
    return NextResponse.json(
      { ok: false, reason: "missing_event_or_invitee" },
      { status: 404 },
    );
  }

  try {
    const links = await getScheduledEventInvitee(
      uuids.eventUuid,
      uuids.inviteeUuid,
    );

    return NextResponse.json({
      ok: true,
      cancelUrl: links.cancelUrl,
      rescheduleUrl: links.rescheduleUrl,
      joinUrl: links.joinUrl,
      startTime: links.startTime,
      status: links.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[link-tracking/calendly-links]", message);
    return NextResponse.json({ ok: false, reason: message }, { status: 502 });
  }
}
