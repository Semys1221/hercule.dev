import { NextResponse } from "next/server";
import { z } from "zod";

import { isNiche } from "@/lib/admin/navigation";
import { resolveInstantlyCampaignId } from "@/lib/admin/niches/outreach-config";
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";

const bodySchema = z.object({
  resyncAll: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  let resyncAll = false;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) {
      resyncAll = parsed.data.resyncAll ?? false;
    }
  } catch {
    // empty body is fine
  }

  const campaignId = await resolveInstantlyCampaignId(rawNiche);
  if (!campaignId) {
    return NextResponse.json(
      { error: "Aucune campagne Instantly liée pour cette niche." },
      { status: 400 },
    );
  }

  try {
    const result = await provisionLinksFromList({
      campaignId,
      category: rawNiche,
      fromCampaign: true,
      resyncAll,
      maxLeads: 500,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provision failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
