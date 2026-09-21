/**
 * Smoke test — JUM link URLs + category wiring (no live Instantly/Calendly calls).
 */
import assert from "node:assert/strict";

import {
  buildInstantlyCustomVariables,
  buildJumLeadUrls,
  buildTrackingUrl,
} from "@/lib/legacy/link-tracking/urls";
import { isLeadCategory } from "@/lib/legacy/link-tracking/types";
import { resolveInterestedEmail1TemplateKey } from "@/lib/legacy/instantly-bypass/jum-segment";

function main(): void {
  assert.equal(isLeadCategory("jum"), true);

  const slug = "jum-smoke-test";
  const email = "smoke@jum-advisory.test";
  const urls = buildJumLeadUrls(slug, email);

  assert.match(urls.reservation_jum_link, /reservation-jum\.html\/jum-smoke-test/);
  assert.match(urls.confirmation_jum_link, /confirm-reservation-jum\.html\/jum-smoke-test/);
  assert.equal(buildTrackingUrl(slug, "jum"), urls.reservation_jum_link);

  const vars = buildInstantlyCustomVariables(slug, email, "NOTBOOKED", "jum", {
    jumSegment: "restaurant",
  });
  assert.equal(vars.jum_segment, "restaurant");
  assert.match(vars.reservation_jum_link ?? "", /reservation-jum\.html/);

  assert.equal(
    resolveInterestedEmail1TemplateKey(
      { payload: { jum_segment: "dentiste" } },
      undefined,
    ),
    "interested_email1_dentiste",
  );

  console.log("smokeJumFlowE2e: ok");
}

main();
