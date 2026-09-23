import { NextResponse } from "next/server";

import { CALENDAR_CONNECTED_PROFILE_KEY } from "@/lib/clients/dashboard-connections";
import { createClientsClient, findClientById } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

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

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      confirmCalendly?: unknown;
      calendlySchedulingUrl?: unknown;
    };

    if (body.confirmCalendly !== true) {
      return NextResponse.json(
        { error: "confirmCalendly must be true" },
        { status: 400 },
      );
    }

    const schedulingRaw =
      typeof body.calendlySchedulingUrl === "string"
        ? body.calendlySchedulingUrl.trim()
        : "";

    const scheduling = parseSchedulingUrl(schedulingRaw);
    if ("error" in scheduling) {
      return NextResponse.json({ error: scheduling.error }, { status: 400 });
    }

    const supabase = createClientsClient();
    const existing = await findClientById(supabase, clientId);
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const nextUrl =
      scheduling.url ?? (existing.calendly_scheduling_url?.trim() || null);
    if (!nextUrl) {
      return NextResponse.json(
        { error: "Indiquez un lien Calendly ou enregistrez-en un avant de confirmer" },
        { status: 400 },
      );
    }

    const profile: Record<string, unknown> = { ...(existing.profile ?? {}) };
    profile[CALENDAR_CONNECTED_PROFILE_KEY] = true;

    const { data, error } = await supabase
      .from("clients")
      .update({
        profile,
        calendly_scheduling_url: nextUrl,
      })
      .eq("id", clientId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to confirm Calendly");
    }

    return NextResponse.json({ ok: true, client: data as ClientRow });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm Calendly";
    console.error("[api/admin/engin/clients/id/calendly]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
