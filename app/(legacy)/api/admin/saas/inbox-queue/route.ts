import { NextResponse } from "next/server";
import { z } from "zod";

import { SAAS_CAPACITY } from "@/lib/legacy/capacity/constants";
import {
  createCapacityClient,
  listInboxQueue,
} from "@/lib/legacy/capacity/supabase";

export async function GET() {
  try {
    const client = createCapacityClient();
    const tickets = await listInboxQueue(client);
    return NextResponse.json({
      tickets,
      defaultInboxesRequested: SAAS_CAPACITY.inboxPerClient,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  notes: z.string().nullable().optional(),
  inboxes_provisioned: z.number().int().min(0).optional(),
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
    if (parsed.data.status) {
      updates.status = parsed.data.status;
      if (parsed.data.status === "completed") {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.inboxes_provisioned !== undefined) {
      updates.inboxes_provisioned = parsed.data.inboxes_provisioned;
    }

    const { data, error } = await client
      .from("inbox_provision_queue")
      .update(updates)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ticket: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
