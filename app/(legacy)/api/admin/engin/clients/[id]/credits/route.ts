import { NextResponse } from "next/server";

import { createClientsClient } from "@/lib/clients/supabase";
import type { CreditField } from "@/lib/clients/engin-types";
import { adjustClientCredits } from "@/lib/clients/workflows/adjust-credits";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function isCreditField(value: unknown): value is CreditField {
  return value === "rdv_used" || value === "rdv_total";
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const clientId = id.trim();
  if (!clientId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as {
      field?: unknown;
      delta?: unknown;
      reason?: unknown;
    };

    if (!isCreditField(body.field)) {
      return NextResponse.json(
        { error: "field must be rdv_used or rdv_total" },
        { status: 400 },
      );
    }

    const delta =
      typeof body.delta === "number"
        ? body.delta
        : typeof body.delta === "string"
          ? Number(body.delta)
          : NaN;

    if (!Number.isFinite(delta) || delta === 0) {
      return NextResponse.json(
        { error: "delta must be a non-zero number" },
        { status: 400 },
      );
    }

    const reason =
      typeof body.reason === "string" ? body.reason.trim() : undefined;

    const result = await adjustClientCredits({
      supabase: createClientsClient(),
      clientId,
      field: body.field,
      delta,
      reason,
    });

    return NextResponse.json({
      ok: true,
      client: result.client,
      previousUsed: result.previousUsed,
      previousTotal: result.previousTotal,
      nextUsed: result.nextUsed,
      nextTotal: result.nextTotal,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to adjust credits";
    const status =
      message === "Client not found"
        ? 404
        : message.includes("delta") || message.includes("bound")
          ? 400
          : 500;
    console.error("[api/admin/engin/clients/id/credits]", message);
    return NextResponse.json({ error: message }, { status });
  }
}
