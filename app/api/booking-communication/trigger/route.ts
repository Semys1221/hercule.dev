import { NextResponse } from "next/server";

import { startBookingSequence } from "@/lib/booking-communication/orchestrator";
import { parseEmailTypes, parseHtmlByType, verifyBookingCommunicationSecret } from "@/lib/booking-communication/route-utils";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadById,
  markInstantlySynced,
  updateLeadStatut,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

function isCategory(value: unknown): value is LeadCategory {
  return value === "agence" || value === "entreprise";
}

export async function POST(request: Request) {
  if (!verifyBookingCommunicationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    mode?: "now" | "scheduled";
    scheduled_at?: string;
    email_types?: unknown;
    html_by_type?: unknown;
    partial?: boolean;
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

  const emailTypes = parseEmailTypes(body.email_types);
  if (body.email_types != null && emailTypes === null) {
    return NextResponse.json({ error: "invalid email_types" }, { status: 400 });
  }

  const htmlByType = parseHtmlByType(body.html_by_type);
  if (body.html_by_type != null && htmlByType === null) {
    return NextResponse.json({ error: "invalid html_by_type" }, { status: 400 });
  }

  const seq = await startBookingSequence({
    category: body.category,
    lead,
    triggeredBy: "manual",
    sequenceStartsAt,
    emailTypes: emailTypes ?? undefined,
    partial: body.partial === true,
    htmlByType: htmlByType ?? undefined,
  });

  return NextResponse.json({ ok: true, ...seq });
}
