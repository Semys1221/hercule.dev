import { NextResponse } from "next/server";
import { z } from "zod";

import { createClientsClient } from "@/lib/clients/supabase";
import { computeNeedsReply } from "@/lib/engin/client-inbox/needs-reply";
import { refreshThreadAggregate } from "@/lib/engin/client-inbox/persist-message";

const bodySchema = z.object({
  read_at: z.string().datetime().nullable().optional(),
  snoozed_until: z.string().datetime().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional(),
  markRead: z.boolean().optional(),
  markResolved: z.boolean().optional(),
});

type Params = { params: Promise<{ threadId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { threadId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const now = new Date().toISOString();

    const patch: Record<string, string | null> = {};
    if (parsed.data.read_at !== undefined) patch.read_at = parsed.data.read_at;
    if (parsed.data.snoozed_until !== undefined) {
      patch.snoozed_until = parsed.data.snoozed_until;
    }
    if (parsed.data.resolved_at !== undefined) {
      patch.resolved_at = parsed.data.resolved_at;
    }
    if (parsed.data.markRead) patch.read_at = now;
    if (parsed.data.markResolved) patch.resolved_at = now;

    const { data: state, error } = await client
      .from("client_inbox_thread_state")
      .upsert(
        { thread_id: threadId, ...patch },
        { onConflict: "thread_id" },
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await refreshThreadAggregate(client, threadId);

    const { data: thread } = await client
      .from("client_inbox_threads")
      .select("last_direction, needs_reply")
      .eq("id", threadId)
      .single();

    const needsReply = thread
      ? computeNeedsReply({
          lastDirection: thread.last_direction as "in" | "out",
          state,
        })
      : false;

    if (thread && thread.needs_reply !== needsReply) {
      await client
        .from("client_inbox_threads")
        .update({ needs_reply: needsReply })
        .eq("id", threadId);
    }

    return NextResponse.json({ state, needsReply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "State update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
