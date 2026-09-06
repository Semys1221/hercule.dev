import { NextResponse } from "next/server";

import { listCampaigns } from "@/lib/instantly-bypass/client";

type CampaignCache = {
  fetchedAt: number;
  campaigns: Array<{ id: string; name: string }>;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: CampaignCache | null = null;

function normalizeCampaigns(
  items: Array<{ id?: string; name?: string }>,
): Array<{ id: string; name: string }> {
  return items
    .filter((item) => Boolean(item.id))
    .map((item) => ({
      id: item.id!,
      name: item.name?.trim() || item.id!,
    }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get("refresh") === "1";
  const apiKey = process.env.INSTANTLY_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { error: "INSTANTLY_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const now = Date.now();
  if (!refresh && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      campaigns: cache.campaigns,
      cached: true,
      fetchedAt: cache.fetchedAt,
    });
  }

  try {
    const raw = await listCampaigns(apiKey);
    const campaigns = normalizeCampaigns(raw);
    cache = { fetchedAt: now, campaigns };
    return NextResponse.json({
      campaigns,
      cached: false,
      fetchedAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
