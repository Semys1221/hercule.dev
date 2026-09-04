import { NextResponse } from "next/server";

import { startRoleRecoverySequence } from "@/lib/booking-communication/orchestrator";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { BookingEmailType } from "@/lib/booking-communication/types";

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

const ROLE_RECOVERY_TYPES = new Set<BookingEmailType>(["role_seq_48", "role_seq_24"]);

function parseRoleRecoveryEmailTypes(value: unknown): BookingEmailType[] | null {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const types: BookingEmailType[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !ROLE_RECOVERY_TYPES.has(item as BookingEmailType)) {
      return null;
    }
    types.push(item as BookingEmailType);
  }
  return types;
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    email?: string;
    email_types?: unknown;
    partial?: boolean;
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

  const emailTypes = parseRoleRecoveryEmailTypes(body.email_types);
  if (body.email_types != null && emailTypes === null) {
    return NextResponse.json({ error: "invalid email_types" }, { status: 400 });
  }

  const seq = await startRoleRecoverySequence({
    category,
    lead,
    triggeredBy: "role_recovery",
    emailTypes: emailTypes ?? undefined,
    partial: body.partial === true,
  });

  return NextResponse.json({ ok: true, ...seq });
}
