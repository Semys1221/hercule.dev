import { NextResponse } from "next/server";

import { startBookingSequence } from "@/lib/booking-communication/orchestrator";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadById,
  markInstantlySynced,
  updateLeadStatut,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

function verifySecret(request: Request): boolean {
  const expected =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

function isCategory(value: unknown): value is LeadCategory {
  return value === "agence" || value === "entreprise";
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    mode?: "now" | "scheduled";
    scheduled_at?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.lead_id || !isCategory(body.category)) {
    return NextResponse.json(
      { error: "lead_id and category required" },
      { status: 400 },
    );
  }

  const client = createLinkTrackingClient();
  let lead = await findLeadById(client, body.category, body.lead_id);
  if (!lead) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }

  if (lead.statut !== "MEETING_BOOKED" && lead.statut !== "BOOKED") {
    lead = await updateLeadStatut(client, body.category, lead.id, "MEETING_BOOKED");
  }

  try {
    await syncLeadStatutToInstantly(lead, body.category, "MEETING_BOOKED");
    await markInstantlySynced(client, body.category, lead.id);
  } catch (err) {
    console.error("[booking-communication/trigger] Instantly sync:", err);
  }

  const sequenceStartsAt =
    body.mode === "scheduled" && body.scheduled_at
      ? new Date(body.scheduled_at)
      : undefined;

  if (sequenceStartsAt && Number.isNaN(sequenceStartsAt.getTime())) {
    return NextResponse.json({ error: "invalid scheduled_at" }, { status: 400 });
  }

  const seq = await startBookingSequence({
    category: body.category,
    lead,
    triggeredBy: "manual",
    sequenceStartsAt,
  });

  return NextResponse.json({ ok: true, ...seq });
}
