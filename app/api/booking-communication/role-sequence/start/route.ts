import { NextResponse } from "next/server";

import { startRoleRecoverySequence } from "@/lib/booking-communication/orchestrator";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadById,
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
    email?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = createLinkTrackingClient();
  let category: LeadCategory | null = isCategory(body.category)
    ? body.category
    : null;
  let lead = body.lead_id && category
    ? await findLeadById(client, category, body.lead_id)
    : null;

  if (!lead && body.email?.trim()) {
    const lookup = await findLeadByEmail(client, body.email.trim().toLowerCase());
    if (lookup) {
      category = lookup.category;
      lead = lookup.lead;
    }
  }

  if (!lead || !category) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }

  if (lead.statut !== "MEETING_BOOKED" && lead.statut !== "BOOKED") {
    return NextResponse.json(
      { error: "lead_not_meeting_booked", statut: lead.statut },
      { status: 409 },
    );
  }

  const seq = await startRoleRecoverySequence({
    category,
    lead,
    triggeredBy: "role_recovery",
  });

  return NextResponse.json({ ok: true, ...seq });
}
