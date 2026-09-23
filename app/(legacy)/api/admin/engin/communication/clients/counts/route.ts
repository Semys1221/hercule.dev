import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import { getInboxCounts } from "@/lib/engin/client-inbox/queries";

export async function GET() {
  try {
    const client = createClientsClient();
    const counts = await getInboxCounts(client);
    return NextResponse.json(counts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load counts";
    console.error("[api/admin/engin/communication/clients/counts]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
