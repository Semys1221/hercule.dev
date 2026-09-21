import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

export async function GET() {
  try {
    const client = createClientsClient();
    const { data, error } = await client
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      clients: (data ?? []) as ClientRow[],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list clients";
    console.error("[api/admin/engin/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
