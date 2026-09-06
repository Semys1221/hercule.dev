import { NextResponse } from "next/server";

import type { TimelineStep } from "@/lib/dashboard/types";
import { isAudience } from "@/lib/admin/navigation";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";

type RouteParams = {
  params: Promise<{ category: string; slug: string }>;
};

function isTimeline(value: unknown): value is TimelineStep[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (step) =>
      typeof step === "object" &&
      step !== null &&
      typeof (step as TimelineStep).id === "string" &&
      typeof (step as TimelineStep).label === "string" &&
      ["done", "active", "pending"].includes((step as TimelineStep).status),
  );
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { category, slug } = await params;
  if (category !== "agence" || !isAudience(category)) {
    return NextResponse.json({ error: "Timeline is agence-only" }, { status: 400 });
  }

  let body: { timeline?: unknown };
  try {
    body = (await request.json()) as { timeline?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isTimeline(body.timeline)) {
    return NextResponse.json({ error: "Invalid timeline" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, slug.trim());
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const profile = { ...(lookup.lead.profile ?? {}) } as Record<string, unknown>;
    const display = { ...((profile.display ?? {}) as Record<string, unknown>) };
    display.timeline = body.timeline;
    profile.display = display;

    const { error } = await client
      .from("agence")
      .update({ profile })
      .eq("id", lookup.lead.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, timeline: body.timeline });
  } catch (error) {
    const message = error instanceof Error ? error.message : "timeline update failed";
    console.error("[admin/clients/timeline]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
