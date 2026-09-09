import { NextResponse } from "next/server";

import {
  getCachedSnapshot,
  setCachedSnapshot,
} from "@/lib/admin/deliverability/cache";
import { buildDeliverabilitySnapshot } from "@/lib/admin/deliverability/snapshot";
import { getDeliverabilitySettings } from "@/lib/admin/deliverability/settings";
import { getInstantlyApiKey } from "@/lib/instantly";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const includeVitals = searchParams.get("vitals") === "1";

  let apiKey: string;
  try {
    apiKey = getInstantlyApiKey();
  } catch {
    return NextResponse.json(
      { error: "INSTANTLY_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const settings = await getDeliverabilitySettings();
    const cached = getCachedSnapshot(settings.refresh_minutes, forceRefresh, includeVitals);
    if (cached) {
      return NextResponse.json(cached);
    }

    const snapshot = await buildDeliverabilitySnapshot({
      apiKey,
      settings,
      includeVitals,
    });

    setCachedSnapshot(snapshot, includeVitals);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
