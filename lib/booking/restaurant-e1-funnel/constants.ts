import { COMPTABLE_DELIVERY_VERTICALS } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";

const restaurantVertical = COMPTABLE_DELIVERY_VERTICALS.find(
  (v) => v.key === "restaurant",
);
if (!restaurantVertical) {
  throw new Error("Restaurant comptable_delivery vertical is not configured");
}

export const RESTAURANT_DCE_CAMPAIGN_ID = restaurantVertical.campaignId;

export const CALENDLY_BOOKING_URL = restaurantVertical.calendlySchedulingUrl;

export const ELIGIBILITY_PAGE_URL =
  "https://www.hercule.dev/reservation/restaurant.html";

export const BYPASS_FLOW_E1 = "interested_email1" as const;

export const METRICS_CACHE_TTL_MS = 5 * 60 * 1000;
