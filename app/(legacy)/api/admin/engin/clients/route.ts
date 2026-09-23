import { NextResponse } from "next/server";

import { clientNeedsOps, clientOpsControls } from "@/lib/clients/engin-ops-controls";
import type { EnginClientRow } from "@/lib/clients/engin-types";
import {
  clientEligibility,
  plannedShares,
} from "@/lib/clients/round-robin";
import { createClientsClient } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

async function loadPaidClientIds(
  client: ReturnType<typeof createClientsClient>,
  clientIds: string[],
): Promise<Set<string>> {
  const paid = new Set<string>();
  if (clientIds.length === 0) return paid;

  const { data, error } = await client
    .from("payments")
    .select("client_id")
    .eq("status", "succeeded")
    .in("client_id", clientIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    if (typeof row.client_id === "string") {
      paid.add(row.client_id);
    }
  }
  return paid;
}

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
    const paid = await loadPaidClientIds(
      client,
      rows.map((row) => row.id),
    );
    const clients: EnginClientRow[] = rows.map((row) => {
      const eligibility = clientEligibility(row);
      const hasSucceededPayment = paid.has(row.id);
      const needsOps = clientNeedsOps(
        clientOpsControls({
          client: row,
          eligibility,
          hasSucceededPayment,
        }),
      );
      return {
        ...row,
        rrSharePct: shares.get(row.id)?.sharePct ?? 0,
        eligibility,
        hasSucceededPayment,
        needsOps,
      };
    });

    return NextResponse.json({ clients });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list clients";
    console.error("[api/admin/engin/clients]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
