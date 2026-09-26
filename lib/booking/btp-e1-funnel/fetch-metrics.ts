import {
  BYPASS_FLOW_E1,
  BYPASS_FLOW_E1_FALLBACK,
  BTP_DCE_CAMPAIGN_ID,
  METRICS_CACHE_TTL_MS,
  RECENT_CLICKS_LIMIT,
} from "@/lib/booking/btp-e1-funnel/constants";
import type { BtpE1FunnelMetrics } from "@/lib/booking/btp-e1-funnel/types";
import { computeFunnelRates } from "@/lib/booking/restaurant-e1-funnel/compute-rates";
import { countActiveInviteesForEventType } from "@/lib/legacy/calendly/list-bookings";
import { resolveCalendlyEventTypeUri } from "@/lib/legacy/admin/niches/outreach-config";
import { createBypassClient } from "@/lib/legacy/instantly-bypass/supabase";
import {
  createLinkTrackingClient,
  isMissingRelationError,
} from "@/lib/legacy/link-tracking/supabase";

let cachedMetrics: BtpE1FunnelMetrics | null = null;
let cachedAtMs = 0;

const RESERVATION_CLICK_STATUTS = [
  "CLICKED",
  "BOOKED",
  "MEETING_BOOKED",
  "CONFIRMED",
  "ONBOARDED",
] as const;

async function countEmailsE1Sent(): Promise<number> {
  const client = createBypassClient();
  const flows = [BYPASS_FLOW_E1, BYPASS_FLOW_E1_FALLBACK];
  let total = 0;

  for (const flow of flows) {
    const { count, error } = await client
      .from("instantly_bypass_events")
      .select("*", { count: "exact", head: true })
      .eq("campaign_id", BTP_DCE_CAMPAIGN_ID)
      .eq("flow", flow)
      .eq("status", "sent");

    if (error) {
      throw new Error(`Failed to count E1 bypass events (${flow}): ${error.message}`);
    }
    total += count ?? 0;
  }

  return total;
}

async function countSharedEligibilityClicks(): Promise<number> {
  const client = createBypassClient();
  const { count, error } = await client
    .from("btp_e1_eligibility_clicks")
    .select("*", { count: "exact", head: true });

  if (error) {
    if (isMissingRelationError(error)) {
      return 0;
    }
    throw new Error(`Failed to count BTP eligibility clicks: ${error.message}`);
  }
  return count ?? 0;
}

async function countReservationPageClicks(): Promise<number> {
  const client = createLinkTrackingClient();
  const { count, error } = await client
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("category", "comptable_delivery")
    .eq("instantly_campaign_id", BTP_DCE_CAMPAIGN_ID)
    .in("statut", [...RESERVATION_CLICK_STATUTS]);

  if (error) {
    if (isMissingRelationError(error)) {
      return 0;
    }
    throw new Error(`Failed to count BTP reservation page clicks: ${error.message}`);
  }
  return count ?? 0;
}

async function countClicks(): Promise<number> {
  const [shared, slugPages] = await Promise.all([
    countSharedEligibilityClicks(),
    countReservationPageClicks(),
  ]);
  return shared + slugPages;
}

async function fetchRecentClicks(): Promise<{ clickedAt: string }[]> {
  const client = createBypassClient();
  const { data, error } = await client
    .from("btp_e1_eligibility_clicks")
    .select("clicked_at")
    .order("clicked_at", { ascending: false })
    .limit(RECENT_CLICKS_LIMIT);

  if (error) {
    if (isMissingRelationError(error)) {
      return [];
    }
    throw new Error(`Failed to list recent BTP clicks: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    clickedAt: String(row.clicked_at),
  }));
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

export async function fetchBtpE1FunnelMetrics(
  options?: { bypassCache?: boolean },
): Promise<BtpE1FunnelMetrics> {
  const nowMs = Date.now();
  if (
    !options?.bypassCache &&
    cachedMetrics &&
    nowMs - cachedAtMs < METRICS_CACHE_TTL_MS
  ) {
    return cachedMetrics;
  }

  const [emailsE1Sent, clicks, bookings, recentClicks] = await Promise.all([
    countEmailsE1Sent(),
    countClicks(),
    countCalendlyBookings(),
    fetchRecentClicks(),
  ]);

  const rates = computeFunnelRates(emailsE1Sent, clicks, bookings);
  const metrics: BtpE1FunnelMetrics = {
    emailsE1Sent,
    clicks,
    bookings,
    ...rates,
    recentClicks,
    fetchedAt: new Date().toISOString(),
  };

  cachedMetrics = metrics;
  cachedAtMs = nowMs;
  return metrics;
}

/** @internal Test helper */
export function clearBtpE1MetricsCache(): void {
  cachedMetrics = null;
  cachedAtMs = 0;
}
