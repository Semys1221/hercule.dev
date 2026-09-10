import { NextResponse } from "next/server";

import {
  deriveOutreachPercents,
  fetchCampaignAnalyticsOverview,
} from "@/lib/instantly/campaign-analytics";
import { resolveInstantlyCampaignId } from "@/lib/admin/niches/outreach-config";
import { isNiche } from "@/lib/admin/navigation";

export async function GET(
  request: Request,
  context: { params: Promise<{ niche: string }> },
) {
  const { niche: rawNiche } = await context.params;
  if (!isNiche(rawNiche)) {
    return NextResponse.json({ error: "Invalid niche" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";

  const campaignId = await resolveInstantlyCampaignId(rawNiche);
  // #region agent log
  await fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "9da3c4",
    },
    body: JSON.stringify({
      sessionId: "9da3c4",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "campaign-stats/route.ts:resolve",
      message: "resolved campaign for stats",
      data: { niche: rawNiche, campaignId, refresh },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!campaignId) {
    return NextResponse.json({ linked: false });
  }

  try {
    const snapshot = await fetchCampaignAnalyticsOverview(campaignId, { refresh });
    const metrics = deriveOutreachPercents(snapshot);
    return NextResponse.json({
      linked: true,
      campaignId,
      sent: metrics.sent,
      replies: snapshot.replies,
      interested: snapshot.interested,
      replyPercent: metrics.replyPercent,
      positivePercent: metrics.positivePercent,
      cached: !refresh,
      fetchedAt: snapshot.fetchedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instantly fetch failed";
    return NextResponse.json({ linked: true, campaignId, error: message }, { status: 500 });
  }
}
