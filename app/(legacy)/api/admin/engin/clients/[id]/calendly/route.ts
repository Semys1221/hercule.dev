import { NextResponse } from "next/server";

import { createClientsClient, findClientById } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { calendlySchedulingUrl?: unknown };
    const raw =
      typeof body.calendlySchedulingUrl === "string"
        ? body.calendlySchedulingUrl.trim()
        : "";

    if (raw) {
      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        return NextResponse.json(
          { error: "URL Calendly invalide" },
          { status: 400 },
        );
      }
      if (parsed.protocol !== "https:") {
        return NextResponse.json(
          { error: "L’URL Calendly doit être en https" },
          { status: 400 },
        );
      }
      if (!parsed.hostname.endsWith("calendly.com")) {
        return NextResponse.json(
          { error: "L’URL doit être un lien calendly.com" },
          { status: 400 },
        );
      }
    }

    const supabase = createClientsClient();
    const existing = await findClientById(supabase, clientId);
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("clients")
      .update({ calendly_scheduling_url: raw || null })
      .eq("id", clientId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update Calendly URL");
    }

    return NextResponse.json({ ok: true, client: data as ClientRow });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update Calendly URL";
    console.error("[api/admin/engin/clients/id/calendly]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
