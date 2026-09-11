import { NextResponse } from "next/server";

import { resolveInstantlyCampaignId } from "@/lib/admin/niches/outreach-config";
import { provisionLinksFromList } from "@/lib/link-tracking/provision-from-list";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${cronSecret}`) return true;
  return request.headers.get("x-cron-secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const niches = ["comptable", "cif"] as const;
    const nicheResults = [];
    for (const niche of niches) {
      const campaignId = await resolveInstantlyCampaignId(niche);
      if (!campaignId) continue;
      nicheResults.push(
        await provisionLinksFromList({
          campaignId,
          category: niche,
          fromCampaign: true,
        }),
      );
    }
    const list = await provisionLinksFromList();
    const created =
      nicheResults.reduce((sum, row) => sum + row.created, 0) + list.created;
    const updated =
      nicheResults.reduce((sum, row) => sum + row.updated, 0) + list.updated;
    const patched =
      nicheResults.reduce((sum, row) => sum + row.patched, 0) + list.patched;
    const failed =
      nicheResults.reduce((sum, row) => sum + row.failed, 0) + list.failed;
    return NextResponse.json({
      ok: true,
      niches: nicheResults,
      list,
      created,
      updated,
      patched,
      failed,
      errors: [...nicheResults.flatMap((row) => row.errors), ...list.errors].slice(
        0,
        20,
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/link-provisioning]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
