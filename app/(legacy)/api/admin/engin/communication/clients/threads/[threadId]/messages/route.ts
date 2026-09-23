import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import { listMessagesForThread } from "@/lib/engin/client-inbox/queries";

type Params = { params: Promise<{ threadId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { threadId } = await params;
  try {
    const client = createClientsClient();
    const messages = await listMessagesForThread(client, threadId);
    const { data: draft } = await client
      .from("client_inbox_drafts")
      .select("*")
      .eq("thread_id", threadId)
      .maybeSingle();
    const { data: thread } = await client
      .from("client_inbox_threads")
      .select("*, clients:client_id(id, email, first_name, slug)")
      .eq("id", threadId)
      .maybeSingle();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ thread, messages, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages";
    console.error("[api/admin/engin/communication/clients/threads/messages]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
