import { NextResponse } from "next/server";

import { sweepMissedReplyInboxes } from "@/lib/legacy/ai-reply-agent/missed-reply-sweep";
import { sweepInterestedLeads } from "@/lib/legacy/ai-reply-agent/interested-sweep";
import { listBypassConfigs } from "@/lib/legacy/instantly-bypass/templates";

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
    const configs = await listBypassConfigs();
    const targets = configs.filter((config) => Boolean(config.initialized_at));
    const results: Record<string, Awaited<ReturnType<typeof sweepInterestedLeads>>> = {};
    const missedReply: Record<
      string,
      Awaited<ReturnType<typeof sweepMissedReplyInboxes>>
    > = {};

    for (const config of targets) {
      missedReply[config.campaign_id] = await sweepMissedReplyInboxes({
        campaignId: config.campaign_id,
        limit: 40,
      });
      results[config.campaign_id] = await sweepInterestedLeads({
        campaignId: config.campaign_id,
        e1Limit: 15,
        replyLimit: 15,
        sinceDays: 30,
      });
    }

    return NextResponse.json({ ok: true, results, missedReply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/ai-reply-agent-interested-sweep]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
