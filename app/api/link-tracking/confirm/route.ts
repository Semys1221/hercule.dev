import { NextResponse } from "next/server";

import { cancelFollowUpJobs } from "@/lib/booking-communication/jobs";
import { syncLeadConfirmedToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadByLink,
  markInstantlyConfirmedSynced,
  markLeadConfirmed,
} from "@/lib/link-tracking/supabase";
import { isMeetingBookedStatus } from "@/lib/link-tracking/types";

export async function POST(request: Request) {
  let body: { slug?: string; email?: string; code?: string };
  try {
    body = (await request.json()) as { slug?: string; email?: string; code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body.slug ?? body.code ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!slug && !email) {
    return NextResponse.json({ error: "slug or email required" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    let lookup = slug ? await findLeadByLink(client, slug) : null;
    if (!lookup && email) {
      lookup = await findLeadByEmail(client, email);
    }
    if (!lookup) {
      return NextResponse.json({ ok: false, reason: "lead_not_found" }, { status: 404 });
    }

    if (lookup.lead.statut === "CONFIRMED") {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        category: lookup.category,
        email: lookup.lead.email,
      });
    }

    if (lookup.lead.statut === "CANCELLED") {
      return NextResponse.json(
        { ok: false, reason: "lead_cancelled" },
        { status: 409 },
      );
    }

    if (!isMeetingBookedStatus(lookup.lead.statut)) {
      return NextResponse.json(
        { ok: false, reason: "not_booked_yet" },
        { status: 409 },
      );
    }

    const confirmed = await markLeadConfirmed(client, lookup);
    await cancelFollowUpJobs(confirmed.lead.id);

    try {
      await syncLeadConfirmedToInstantly(confirmed.lead, confirmed.category);
      await markInstantlyConfirmedSynced(
        client,
        confirmed.category,
        confirmed.lead.id,
      );
    } catch (err) {
      console.error("[link-tracking/confirm] Instantly sync failed:", err);
    }

    return NextResponse.json({
      ok: true,
      statut: confirmed.lead.statut,
      category: confirmed.category,
      email: confirmed.lead.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[link-tracking/confirm]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
