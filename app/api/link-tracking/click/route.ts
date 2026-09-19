import { NextResponse } from "next/server";

import { resolveJumVerticalByCampaignId } from "@/lib/admin/niches/jum-verticals";
import { syncLeadStatutToInstantly } from "@/lib/link-tracking/instantly";
import {
  createLinkTrackingClient,
  findLeadByLink,
  markLeadClicked,
} from "@/lib/link-tracking/supabase";

function readJumSegment(
  profile: Record<string, unknown> | null | undefined,
  campaignId: string | null | undefined,
): string | null {
  if (profile) {
    for (const key of ["jum_segment", "segment"] as const) {
      const value = profile[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim().toLowerCase();
      }
    }
  }
  if (campaignId?.trim()) {
    const vertical = resolveJumVerticalByCampaignId(campaignId);
    if (vertical) return vertical.segment;
  }
  return null;
}

/** Records link click and moves NOTBOOKED leads to CLICKED. */
export async function POST(request: Request) {
  let body: { slug?: string };
  try {
    body = (await request.json()) as { slug?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, slug);
    if (!lookup) {
      return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
    }

    let statut = lookup.lead.statut;
    const clicked = await markLeadClicked(client, lookup);
    if (clicked) {
      statut = clicked.lead.statut;
      try {
        await syncLeadStatutToInstantly(clicked.lead, clicked.category, "CLICKED");
      } catch (err) {
        console.error("[link-tracking/click] Instantly sync failed:", err);
      }
    }

    const segment = readJumSegment(
      lookup.lead.profile,
      lookup.lead.instantly_campaign_id,
    );

    return NextResponse.json({
      ok: true,
      category: lookup.category,
      email: lookup.lead.email,
      statut,
      segment,
      campaignId: lookup.lead.instantly_campaign_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
