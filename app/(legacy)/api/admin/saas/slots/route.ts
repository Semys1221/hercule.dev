import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createCapacityClient,
  listSlots,
} from "@/lib/legacy/capacity/supabase";

export async function GET() {
  try {
    const client = createCapacityClient();
    const slots = await listSlots(client);
    return NextResponse.json({ slots });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  capacity_status: z
    .enum(["queued_warmup", "active", "paused", "churned"])
    .optional(),
  instantly_campaign_id: z.string().nullable().optional(),
  instantly_list_id: z.string().nullable().optional(),
  calendly_scheduling_url: z.string().nullable().optional(),
  niche_preferences: z
    .object({
      restaurant: z.number().optional(),
      sante: z.number().optional(),
      btp: z.number().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createCapacityClient();
    const updates: Record<string, unknown> = {};
    if (parsed.data.capacity_status) {
      updates.capacity_status = parsed.data.capacity_status;
      if (parsed.data.capacity_status === "active") {
        updates.activated_at = new Date().toISOString();
      }
    }
    if (parsed.data.instantly_campaign_id !== undefined) {
      updates.instantly_campaign_id = parsed.data.instantly_campaign_id;
    }
    if (parsed.data.instantly_list_id !== undefined) {
      updates.instantly_list_id = parsed.data.instantly_list_id;
    }
    if (parsed.data.calendly_scheduling_url !== undefined) {
      updates.calendly_scheduling_url = parsed.data.calendly_scheduling_url;
    }
    if (parsed.data.niche_preferences) {
      updates.niche_preferences = parsed.data.niche_preferences;
    }

    const { data, error } = await client
      .from("client_outreach_slots")
      .update(updates)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ slot: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
