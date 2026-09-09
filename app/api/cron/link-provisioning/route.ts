import { NextResponse } from "next/server";

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
    const campaign = await provisionLinksFromList({ fromCampaign: true });
    const list = await provisionLinksFromList();
    return NextResponse.json({
      ok: true,
      campaign,
      list,
      created: campaign.created + list.created,
      updated: campaign.updated + list.updated,
      patched: campaign.patched + list.patched,
      failed: campaign.failed + list.failed,
      errors: [...campaign.errors, ...list.errors].slice(0, 20),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/link-provisioning]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
