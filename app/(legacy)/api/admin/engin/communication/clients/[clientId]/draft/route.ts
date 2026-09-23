import { NextResponse } from "next/server";
import { z } from "zod";

import { createClientsClient } from "@/lib/clients/supabase";

const bodySchema = z.object({
  threadId: z.string().uuid().nullable().optional(),
  subject: z.string().optional(),
  body: z.string(),
});

type Params = { params: Promise<{ clientId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { clientId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const threadId = parsed.data.threadId ?? null;

    if (threadId) {
      const { data: existing } = await client
        .from("client_inbox_drafts")
        .select("id")
        .eq("client_id", clientId)
        .eq("thread_id", threadId)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await client
          .from("client_inbox_drafts")
          .update({
            subject: parsed.data.subject ?? "",
            body: parsed.data.body,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ draft: data });
      }

      const { data, error } = await client
        .from("client_inbox_drafts")
        .insert({
          client_id: clientId,
          thread_id: threadId,
          subject: parsed.data.subject ?? "",
          body: parsed.data.body,
        })
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ draft: data });
    }

    const { data: existing } = await client
      .from("client_inbox_drafts")
      .select("id")
      .eq("client_id", clientId)
      .is("thread_id", null)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await client
        .from("client_inbox_drafts")
        .update({
          subject: parsed.data.subject ?? "",
          body: parsed.data.body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ draft: data });
    }

    const { data, error } = await client
      .from("client_inbox_drafts")
      .insert({
        client_id: clientId,
        thread_id: null,
        subject: parsed.data.subject ?? "",
        body: parsed.data.body,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ draft: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
