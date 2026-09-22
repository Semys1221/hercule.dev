import { NextResponse } from "next/server";

import {
  CALENDAR_CONNECTED_PROFILE_KEY,
  CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY,
} from "@/lib/clients/dashboard-connections";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";
import {
  isClientVideoConference,
  type ClientVideoConference,
} from "@/lib/clients/video-conference";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function parseSchedulingUrl(raw: string): { url: string | null } | { error: string } {
  if (!raw) return { url: null };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "URL Calendly invalide" };
  }
  if (parsed.protocol !== "https:") {
    return { error: "L’URL Calendly doit être en https" };
  }
  if (!parsed.hostname.endsWith("calendly.com")) {
    return { error: "L’URL doit être un lien calendly.com" };
  }
  return { url: raw };
}

function parseEventTypeUri(raw: string): { uri: string | null } | { error: string } {
  if (!raw) return { uri: null };
  if (!raw.startsWith("https://api.calendly.com/event_types/")) {
    return { error: "URI d’event type Calendly invalide" };
  }
  return { uri: raw };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      calendarConnected?: unknown;
      videoConference?: unknown;
      calendlyBookingsEnabled?: unknown;
      calendlyEventTypeUri?: unknown;
      calendlySchedulingUrl?: unknown;
    };

    if (typeof body.calendarConnected !== "boolean") {
      return NextResponse.json(
        { error: "calendarConnected must be a boolean" },
        { status: 400 },
      );
    }
    if (typeof body.calendlyBookingsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "calendlyBookingsEnabled must be a boolean" },
        { status: 400 },
      );
    }

    let videoConference: ClientVideoConference | null = null;
    if (body.videoConference != null && body.videoConference !== "") {
      if (!isClientVideoConference(body.videoConference)) {
        return NextResponse.json(
          { error: "Visioconférence invalide" },
          { status: 400 },
        );
      }
      videoConference = body.videoConference;
    }

    const schedulingRaw =
      typeof body.calendlySchedulingUrl === "string"
        ? body.calendlySchedulingUrl.trim()
        : "";
    const eventTypeRaw =
      typeof body.calendlyEventTypeUri === "string"
        ? body.calendlyEventTypeUri.trim()
        : "";

    const scheduling = parseSchedulingUrl(schedulingRaw);
    if ("error" in scheduling) {
      return NextResponse.json({ error: scheduling.error }, { status: 400 });
    }
    const eventType = parseEventTypeUri(eventTypeRaw);
    if ("error" in eventType) {
      return NextResponse.json({ error: eventType.error }, { status: 400 });
    }

    if (body.calendlyBookingsEnabled && (!scheduling.url || !eventType.uri)) {
      return NextResponse.json(
        { error: "Choisissez un event Calendly pour activer les réservations" },
        { status: 400 },
      );
    }

    const supabase = createClientsClient();
    const existing = await findClientById(supabase, clientId);
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const profile: Record<string, unknown> = { ...(existing.profile ?? {}) };
    profile[CALENDAR_CONNECTED_PROFILE_KEY] = body.calendarConnected;
    profile[CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY] = body.calendlyBookingsEnabled;
    if (videoConference) {
      profile.video_conference = videoConference;
    } else {
      delete profile.video_conference;
    }

    const { data, error } = await supabase
      .from("clients")
      .update({
        profile,
        calendly_scheduling_url: scheduling.url,
        calendly_event_type_uri: eventType.uri,
      })
      .eq("id", clientId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update dashboard connections");
    }

    return NextResponse.json({ ok: true, client: data as ClientRow });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update dashboard connections";
    console.error("[api/admin/engin/clients/id/connections]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
