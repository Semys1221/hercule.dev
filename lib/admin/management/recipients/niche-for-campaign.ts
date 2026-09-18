import { ALL_NICHES, type Niche } from "@/lib/admin/navigation";
import { getOutreachConfigView } from "@/lib/admin/niches/outreach-config";

const cache = new Map<string, Niche | null>();

export async function nicheForCampaignId(campaignId: string): Promise<Niche | null> {
  const normalized = campaignId.trim();
  if (!normalized) {
    return null;
  }
  if (cache.has(normalized)) {
    return cache.get(normalized) ?? null;
  }

  for (const niche of ALL_NICHES) {
    const config = await getOutreachConfigView(niche);
    if (config.instantly_campaign_id?.trim() === normalized) {
      cache.set(normalized, niche);
      return niche;
    }
  }

  cache.set(normalized, null);
  return null;
}
