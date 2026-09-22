import { NextResponse } from "next/server";

import {
  clientEligibility,
  plannedShares,
} from "@/lib/clients/round-robin";
import { createClientsClient } from "@/lib/clients/supabase";
import type { EnginClientRow } from "@/lib/clients/engin-types";
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

    const rows = (data ?? []) as ClientRow[];
    const shares = plannedShares(rows);
    const clients: EnginClientRow[] = rows.map((row) => ({
      ...row,
      rrSharePct: shares.get(row.id)?.sharePct ?? 0,
      eligibility: clientEligibility(row),
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list clients";
    console.error("[api/admin/engin/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
