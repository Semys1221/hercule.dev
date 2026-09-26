import { COMPTABLE_DELIVERY_VERTICALS } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";

const btpVertical = COMPTABLE_DELIVERY_VERTICALS.find((v) => v.key === "btp");
if (!btpVertical) {
  throw new Error("BTP comptable_delivery vertical is not configured");
}

export const BTP_DCE_CAMPAIGN_ID = btpVertical.campaignId;

export const CALENDLY_BOOKING_URL = btpVertical.calendlySchedulingUrl;

export const ELIGIBILITY_PAGE_URL =
  "https://www.hercule.dev/reservation/btp.html";

export const BYPASS_FLOW_E1 = "interested_email1_b2b" as const;

export const BYPASS_FLOW_E1_FALLBACK = "interested_email1" as const;

export const METRICS_CACHE_TTL_MS = 5 * 60 * 1000;

export const RECENT_CLICKS_LIMIT = 50;
