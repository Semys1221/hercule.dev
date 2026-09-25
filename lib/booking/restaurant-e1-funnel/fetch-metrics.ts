import {
  BYPASS_FLOW_E1,
  METRICS_CACHE_TTL_MS,
  RESTAURANT_DCE_CAMPAIGN_ID,
} from "@/lib/booking/restaurant-e1-funnel/constants";
import type { RestaurantE1FunnelMetrics } from "@/lib/booking/restaurant-e1-funnel/types";
import { computeFunnelRates } from "@/lib/booking/restaurant-e1-funnel/compute-rates";
import { countActiveInviteesForEventType } from "@/lib/legacy/calendly/list-bookings";
import { resolveCalendlyEventTypeUri } from "@/lib/legacy/admin/niches/outreach-config";
import { createBypassClient } from "@/lib/legacy/instantly-bypass/supabase";
import { isMissingRelationError } from "@/lib/legacy/link-tracking/supabase";

let cachedMetrics: RestaurantE1FunnelMetrics | null = null;
let cachedAtMs = 0;

async function countEmailsE1Sent(): Promise<number> {
  const client = createBypassClient();
  const { count, error } = await client
    .from("instantly_bypass_events")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", RESTAURANT_DCE_CAMPAIGN_ID)
    .eq("flow", BYPASS_FLOW_E1)
    .eq("status", "sent");

  if (error) {
    throw new Error(`Failed to count E1 bypass events: ${error.message}`);
  }
  return count ?? 0;
}

async function countEligibilityClicks(): Promise<number> {
  const client = createBypassClient();
  const { count, error } = await client
    .from("restaurant_e1_eligibility_clicks")
    .select("*", { count: "exact", head: true });

  if (error) {
    if (isMissingRelationError(error)) {
      return 0;
    }
    throw new Error(`Failed to count eligibility clicks: ${error.message}`);
  }
  return count ?? 0;
}

async function countCalendlyBookings(): Promise<number> {
  const eventTypeUri = await resolveCalendlyEventTypeUri("comptable_delivery");
  if (!eventTypeUri) {
    throw new Error(
      "Calendly event type URI for comptable_delivery is not configured",
    );
  }
  return countActiveInviteesForEventType(eventTypeUri);
}

export async function fetchRestaurantE1FunnelMetrics(
  options?: { bypassCache?: boolean },
): Promise<RestaurantE1FunnelMetrics> {
  const nowMs = Date.now();
  if (
    !options?.bypassCache &&
    cachedMetrics &&
    nowMs - cachedAtMs < METRICS_CACHE_TTL_MS
  ) {
    return cachedMetrics;
  }

  const [emailsE1Sent, clicks, bookings] = await Promise.all([
    countEmailsE1Sent(),
    countEligibilityClicks(),
    countCalendlyBookings(),
  ]);

  const rates = computeFunnelRates(emailsE1Sent, clicks, bookings);
  const metrics: RestaurantE1FunnelMetrics = {
    emailsE1Sent,
    clicks,
    bookings,
    ...rates,
    fetchedAt: new Date().toISOString(),
  };

  cachedMetrics = metrics;
  cachedAtMs = nowMs;
  return metrics;
}

/** @internal Test helper */
export function clearRestaurantE1MetricsCache(): void {
  cachedMetrics = null;
  cachedAtMs = 0;
}
