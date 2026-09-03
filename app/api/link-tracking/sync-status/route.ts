import { NextResponse } from "next/server";

import { cancelFollowUpJobs } from "@/lib/booking-communication/jobs";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadById,
  markInstantlyConfirmedSynced,
  markInstantlySynced,
  updateLeadStatut,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory, LeadStatut } from "@/lib/link-tracking/types";

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

function isStatut(value: unknown): value is LeadStatut {
  return (
    value === "NOTBOOKED" ||
    value === "CLICKED" ||
    value === "BOOKED" ||
    value === "MEETING_BOOKED" ||
    value === "CONFIRMED" ||
    value === "CANCELLED"
  );
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    statut?: string;
    first_name?: string;
    company?: string;
    scheduled_at?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.lead_id || !isCategory(body.category) || !isStatut(body.statut)) {
    return NextResponse.json(
      { error: "lead_id, category and statut required" },
      { status: 400 },
    );
  }

  const extra: Record<string, unknown> = {};
  if (body.first_name !== undefined) extra.first_name = body.first_name;
  if (body.company !== undefined) extra.company = body.company;
  if (body.scheduled_at) extra.scheduled_at = body.scheduled_at;

  const client = createLinkTrackingClient();
  const previous = await findLeadById(client, body.category, body.lead_id);
  if (!previous) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }

  const lead = await updateLeadStatut(
    client,
    body.category,
    body.lead_id,
    body.statut,
    extra,
  );

  try {
    await syncLeadStatutToInstantly(lead, body.category, lead.statut);
    if (lead.statut === "MEETING_BOOKED" || lead.statut === "BOOKED") {
      await markInstantlySynced(client, body.category, lead.id);
    }
    if (lead.statut === "CONFIRMED") {
      await markInstantlyConfirmedSynced(client, body.category, lead.id);
      await cancelFollowUpJobs(lead.id);
    }
  } catch (err) {
    console.error("[link-tracking/sync-status] Instantly sync:", err);
  }

  return NextResponse.json({
    ok: true,
    statut: lead.statut,
    previous: previous.statut,
  });
}
