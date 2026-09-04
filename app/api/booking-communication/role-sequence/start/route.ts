import { NextResponse } from "next/server";

import { startRoleRecoverySequence } from "@/lib/booking-communication/orchestrator";
import {
  parseHtmlByType,
  verifyBookingCommunicationSecret,
} from "@/lib/booking-communication/route-utils";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadById,
} from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

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
  if (!verifyBookingCommunicationSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    lead_id?: string;
    category?: string;
    email?: string;
    email_types?: unknown;
    html_by_type?: unknown;
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

  const htmlByType = parseHtmlByType(body.html_by_type);
  if (body.html_by_type != null && htmlByType === null) {
    return NextResponse.json({ error: "invalid html_by_type" }, { status: 400 });
  }

  const seq = await startRoleRecoverySequence({
    category,
    lead,
    triggeredBy: "role_recovery",
    emailTypes: emailTypes ?? undefined,
    partial: body.partial === true,
    htmlByType: htmlByType ?? undefined,
  });

  return NextResponse.json({ ok: true, ...seq });
}
