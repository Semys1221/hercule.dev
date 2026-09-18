import { NextResponse } from "next/server";

import { sweepAlternateReplyInboxes } from "@/lib/ai-reply-agent/alternate-reply-sweep";
import { sweepInterestedLeads } from "@/lib/ai-reply-agent/interested-sweep";
import { listBypassConfigs } from "@/lib/instantly-bypass/templates";

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
    const alternateReply: Record<
      string,
      Awaited<ReturnType<typeof sweepAlternateReplyInboxes>>
    > = {};

    for (const config of targets) {
      results[config.campaign_id] = await sweepInterestedLeads({
        campaignId: config.campaign_id,
        e1Limit: 15,
        replyLimit: 15,
        sinceDays: 30,
      });
      alternateReply[config.campaign_id] = await sweepAlternateReplyInboxes({
        campaignId: config.campaign_id,
        limit: 40,
      });
    }

    return NextResponse.json({ ok: true, results, alternateReply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/ai-reply-agent-interested-sweep]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
