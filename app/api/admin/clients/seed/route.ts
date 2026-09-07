import { NextResponse } from "next/server";

import { seedFakeClients } from "@/lib/admin/clients/seed";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";

export async function POST() {
  try {
    const client = createLinkTrackingClient();
    const { slugs } = await seedFakeClients(client);
    return NextResponse.json({ ok: true, slugs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "seed failed";
    console.error("[admin/clients/seed]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
