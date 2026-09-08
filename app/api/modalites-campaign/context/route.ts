import { NextResponse } from "next/server";

import { formatMeetingDateTime } from "@/lib/booking-communication/templates";
import {
  modalitesFormulas,
  modalitesIntro,
  MODALITES_CONFIRM_BUTTON_LABEL,
} from "@/lib/modalites-campaign/copy";
import {
  createLinkTrackingClient,
  findLeadByEmail,
  findLeadByLink,
} from "@/lib/link-tracking/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? searchParams.get("code") ?? "").trim();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();

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

    const { date, heure } = formatMeetingDateTime(lookup.lead.scheduled_at);
    return NextResponse.json({
      ok: true,
      audience: lookup.category,
      firstName: lookup.lead.first_name,
      scheduledAt: lookup.lead.scheduled_at,
      date,
      heure,
      statut: lookup.lead.statut,
      alreadyConfirmed: lookup.lead.statut === "CONFIRMED",
      cancelled: lookup.lead.statut === "CANCELLED",
      intro: modalitesIntro(lookup.category),
      formulas: modalitesFormulas(lookup.category),
      buttonLabel: MODALITES_CONFIRM_BUTTON_LABEL,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[modalites-campaign/context]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
