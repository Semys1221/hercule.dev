import { NextResponse } from "next/server";

import { listRecipients } from "@/lib/admin/management/recipients/queries";
import { isNiche, type Niche } from "@/lib/admin/navigation";
import type { ManagementPhase, RecipientStatus } from "@/lib/admin/management/recipients/types";

function parsePhase(value: string | null): ManagementPhase | undefined {
  if (value === "outreach" || value === "booking" || value === "client") {
    return value;
  }
  return undefined;
}

function parseStatus(value: string | null): RecipientStatus | undefined {
  const allowed: RecipientStatus[] = [
    "scheduled",
    "active",
    "paused",
    "completed",
    "stopped",
    "failed",
  ];
  if (value && allowed.includes(value as RecipientStatus)) {
    return value as RecipientStatus;
  }
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche");
  if (!niche || !isNiche(niche)) {
    return NextResponse.json({ error: "niche required" }, { status: 400 });
  }

  try {
    const result = await listRecipients({
      niche: niche as Niche,
      phase: parsePhase(searchParams.get("phase")),
      status: parseStatus(searchParams.get("status")),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "list_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
