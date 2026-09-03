import { NextResponse } from "next/server";

import { syncBookedLeadToInstantlyById } from "@/lib/link-tracking/book-lead";
import type { LeadCategory } from "@/lib/link-tracking/types";

function verifySecret(request: Request): boolean {
  const expected = process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${expected}`) {
    return true;
  }

  const url = new URL(request.url);
  return url.searchParams.get("secret") === expected;
}

type SupabaseWebhookRecord = {
  id?: string;
  statut?: string;
};

type SupabaseWebhookPayload = {
  type?: string;
  table?: string;
  record?: SupabaseWebhookRecord;
  old_record?: SupabaseWebhookRecord;
};

function isLeadCategory(table: string | undefined): table is LeadCategory {
  return table === "agence" || table === "entreprise";
}

/** Option B: Supabase Database Webhook → sync Instantly when statut becomes BOOKED. */
export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SupabaseWebhookPayload;
  try {
    body = (await request.json()) as SupabaseWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.type !== "UPDATE" || !isLeadCategory(body.table)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const record = body.record;
  const oldRecord = body.old_record;
  if (!record?.id) {
    return NextResponse.json({ ok: true, ignored: "not_a_booking_transition" });
  }
  const bookedNow =
    record.statut === "BOOKED" || record.statut === "MEETING_BOOKED";
  const bookedBefore =
    oldRecord?.statut === "BOOKED" || oldRecord?.statut === "MEETING_BOOKED";
  if (!bookedNow || bookedBefore) {
    return NextResponse.json({ ok: true, ignored: "not_a_booking_transition" });
  }

  try {
    const result = await syncBookedLeadToInstantlyById(body.table, record.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[link-tracking/supabase-webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
