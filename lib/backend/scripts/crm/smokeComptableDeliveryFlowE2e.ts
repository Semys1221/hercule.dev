/**
 * Smoke test — comptable_delivery link URLs + category wiring (no live API).
 */
import assert from "node:assert/strict";

import {
  buildComptableDeliveryLeadUrls,
  buildInstantlyCustomVariables,
  buildComptableDeliveryTrackingUrl,
} from "@/lib/legacy/link-tracking/urls";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";
import { resolveInterestedEmail1TemplateKey } from "@/lib/legacy/instantly-bypass/jum-segment";
import { getFunnelCopy } from "@/lib/booking/comptable-delivery-funnel/copy";
import { isPreBookingComplete } from "@/lib/booking/comptable-delivery-funnel/navigation";

function main(): void {
  assert.equal(isLeadCategory("comptable_delivery"), true);

  const slug = "delivery-smoke-test";
  const email = "smoke@delivery.test";
  const urls = buildComptableDeliveryLeadUrls(slug, email, "restaurant");

  assert.match(
    urls.reservation_comptable_delivery_link,
    /\/reservation\/restaurant\/delivery-smoke-test/,
  );
  assert.match(
    urls.confirmation_comptable_delivery_link,
    /confirm-reservation-jum\.html\/delivery-smoke-test/,
  );
  assert.match(
    buildComptableDeliveryTrackingUrl(slug, "btp"),
    /\/reservation\/btp\/delivery-smoke-test/,
  );

  const vars = buildInstantlyCustomVariables(
    slug,
    email,
    "NOTBOOKED",
    "comptable_delivery",
    {
      comptableDeliverySegment: "restaurant",
      comptableDeliveryRouteSegment: "restaurant",
    },
  );
  assert.equal(vars.jum_segment, "restaurant");
  assert.match(vars.reservation_jum_link ?? "", /\/reservation\/restaurant\//);

  assert.equal(
    resolveInterestedEmail1TemplateKey(
      { payload: { jum_segment: "dentiste" } },
      undefined,
    ),
    "interested_email1_dentiste",
  );

  const restaurantCopy = getFunnelCopy("restaurant");
  assert.equal(restaurantCopy.steps.intro.kind, "intro");
  const btpCopy = getFunnelCopy("btp");
  assert.match(btpCopy.steps.visibility.options[0].label, /matériaux|achats/i);
  assert.equal(isPreBookingComplete({}), false);

  console.log("smokeComptableDeliveryFlowE2e: ok");
}

main();
