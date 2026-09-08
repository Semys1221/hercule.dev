import { getInstantlyApiKey, instantlyFetch } from "@/lib/instantly";

export type CampaignAnalyticsSnapshot = {
  campaignId: string;
  sent: number;
  replies: number;
  interested: number;
  fetchedAt: number;
};

type OverviewRow = {
  campaign_id?: string;
  emails_sent_count?: number;
  reply_count_unique?: number;
  total_interested?: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CampaignAnalyticsSnapshot>();

function percent(count: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((count / total) * 1000) / 10;
}

export async function fetchCampaignAnalyticsOverview(
  campaignId: string,
  options?: { refresh?: boolean },
): Promise<CampaignAnalyticsSnapshot> {
  const key = campaignId.trim();
  const cached = cache.get(key);
  const now = Date.now();
  if (!options?.refresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const apiKey = getInstantlyApiKey();
  const query = new URLSearchParams({ id: key });
  const payload = await instantlyFetch<OverviewRow | OverviewRow[]>(
    apiKey,
    `/campaigns/analytics/overview?${query.toString()}`,
    { method: "GET" },
  );

  const row = Array.isArray(payload) ? payload[0] : payload;
  const snapshot: CampaignAnalyticsSnapshot = {
    campaignId: key,
    sent: Number(row?.emails_sent_count ?? 0),
    replies: Number(row?.reply_count_unique ?? 0),
    interested: Number(row?.total_interested ?? 0),
    fetchedAt: now,
  };

  cache.set(key, snapshot);
  return snapshot;
}

export function deriveOutreachPercents(snapshot: CampaignAnalyticsSnapshot) {
  return {
    sent: snapshot.sent,
    replyPercent: percent(snapshot.replies, snapshot.sent),
    positivePercent: percent(snapshot.interested, snapshot.sent),
  };
}
