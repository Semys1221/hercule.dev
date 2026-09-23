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
    const threads = await listClientInboxThreads(client, { filter });
    return NextResponse.json({ threads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list inbox";
    console.error("[api/admin/engin/communication/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
