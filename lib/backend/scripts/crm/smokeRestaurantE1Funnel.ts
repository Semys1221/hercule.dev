/**
 * Smoke — restaurant E1 eligibility funnel static pages + constants (no live API).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BYPASS_FLOW_E1,
  CALENDLY_BOOKING_URL,
  ELIGIBILITY_PAGE_URL,
  RESTAURANT_DCE_CAMPAIGN_ID,
} from "@/lib/booking/restaurant-e1-funnel/constants";

const ROOT = join(process.cwd());

function main(): void {
  assert.equal(RESTAURANT_DCE_CAMPAIGN_ID, "e4f11e76-717e-4be9-a6ad-c7f0a331afb7");
  assert.equal(BYPASS_FLOW_E1, "interested_email1");
  assert.match(ELIGIBILITY_PAGE_URL, /reservation\/restaurant\.html$/);
  assert.match(CALENDLY_BOOKING_URL, /rentabilite-restaurant/);

  const restaurantHtml = readFileSync(
    join(ROOT, "public/reservation/restaurant.html"),
    "utf8",
  );
  assert.match(restaurantHtml, /\/api\/restaurant-e1\/eligibility-click/);
  assert.match(restaurantHtml, /rentabilite-restaurant/);

  const trackingHtml = readFileSync(
    join(ROOT, "public/reservation/link-tracking.html"),
    "utf8",
  );
  assert.match(trackingHtml, /\/api\/restaurant-e1\/metrics/);

  console.log("smokeRestaurantE1Funnel: ok");
}

main();
