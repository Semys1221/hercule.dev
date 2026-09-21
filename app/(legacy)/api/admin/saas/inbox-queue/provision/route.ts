import { NextResponse } from "next/server";
import { z } from "zod";

import { SAAS_CAPACITY } from "@/lib/legacy/capacity/constants";
import { createCapacityClient } from "@/lib/legacy/capacity/supabase";

const bodySchema = z.object({
  ticketId: z.string().uuid(),
  inboxes: z
    .array(
      z.object({
        email: z.string().email(),
        instantly_account_id: z.string().optional(),
      }),
    )
    .min(1)
    .max(SAAS_CAPACITY.inboxPerClient),
  activateSlot: z.boolean().optional().default(false),
});

/**
 * Attach provisioned Instantly inboxes to a client slot from an inbox_queue ticket.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const client = createCapacityClient();
    const { data: ticket, error: ticketError } = await client
      .from("inbox_provision_queue")
      .select("*")
      .eq("id", parsed.data.ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: ticketError?.message ?? "Ticket not found" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    const rows = parsed.data.inboxes.map((inbox) => ({
      email: inbox.email.trim().toLowerCase(),
      instantly_account_id: inbox.instantly_account_id?.trim() || null,
      client_slot_id: ticket.client_slot_id,
      status: "warmup" as const,
      warmup_started_at: now,
      daily_send_cap: SAAS_CAPACITY.dailySendCapPerInbox,
    }));

    const { data: inserted, error: insertError } = await client
      .from("inbox_pool")
      .upsert(rows, { onConflict: "email" })
      .select("*");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const provisioned =
      (ticket.inboxes_provisioned ?? 0) + (inserted?.length ?? rows.length);
    const completed =
      provisioned >= (ticket.inboxes_requested ?? SAAS_CAPACITY.inboxPerClient);

    await client
      .from("inbox_provision_queue")
      .update({
        inboxes_provisioned: provisioned,
        status: completed ? "completed" : "in_progress",
        completed_at: completed ? now : null,
      })
      .eq("id", ticket.id);

    if (parsed.data.activateSlot || completed) {
      await client
        .from("client_outreach_slots")
        .update({
          capacity_status: "active",
          activated_at: now,
        })
        .eq("id", ticket.client_slot_id);
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted?.length ?? rows.length,
      provisioned,
      completed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
