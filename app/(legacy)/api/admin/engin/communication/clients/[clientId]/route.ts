import { NextResponse } from "next/server";

import { findClientById, createClientsClient } from "@/lib/clients/supabase";
import { listThreadsForClient } from "@/lib/engin/client-inbox/queries";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { clientId } = await params;
  try {
    const client = createClientsClient();
    const row = await findClientById(client, clientId);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const threads = await listThreadsForClient(client, clientId);
    const { data: draft } = await client
      .from("client_inbox_drafts")
      .select("*")
      .eq("client_id", clientId)
      .is("thread_id", null)
      .maybeSingle();

    return NextResponse.json({ client: row, threads, draft });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load client inbox";
    console.error("[api/admin/engin/communication/clients/clientId]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
