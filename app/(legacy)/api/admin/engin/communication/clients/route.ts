import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import {
  listClientInboxThreads,
  type InboxListFilter,
} from "@/lib/engin/client-inbox/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filterParam = url.searchParams.get("filter") ?? "all";
    const filter: InboxListFilter =
      filterParam === "needs_reply" || filterParam === "unread"
        ? filterParam
        : "all";

    const client = createClientsClient();
    // #region agent log
    {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
      let supabaseHost = "unknown";
      try {
        supabaseHost = new URL(supabaseUrl).host;
      } catch {
        supabaseHost = "invalid-url";
      }
      const probe = await client.from("clients").select("id").limit(1);
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "9a2b79",
        },
        body: JSON.stringify({
          sessionId: "9a2b79",
          runId: "pre-fix",
          hypothesisId: "A-B",
          location: "clients/route.ts:GET",
          message: "supabase probe before listClientInboxThreads",
          data: {
            supabaseHost,
            clientsProbeOk: !probe.error,
            clientsProbeCode: probe.error?.code ?? null,
            clientsProbeHint: probe.error?.hint ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
    const threads = await listClientInboxThreads(client, { filter });
    return NextResponse.json({ threads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list inbox";
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9a2b79",
      },
      body: JSON.stringify({
        sessionId: "9a2b79",
        runId: "pre-fix",
        hypothesisId: "A-C",
        location: "clients/route.ts:GET:catch",
        message: "listClientInboxThreads failed",
        data: {
          errorMessage: message,
          isSchemaCache: message.includes("schema cache"),
          isMissingTable: message.includes("client_inbox_threads"),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error("[api/admin/engin/communication/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
