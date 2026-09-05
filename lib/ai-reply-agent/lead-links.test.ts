/** Unit tests for AI reply agent CTA link resolution and substitution. */

import assert from "node:assert/strict";

import {
  applyPromptLinkVariables,
  ctaLinkColumn,
  fallbackCtaLink,
} from "@/lib/ai-reply-agent/lead-links";

function main() {
  assert.equal(ctaLinkColumn("buyer"), "reservation_agence_link");
  assert.equal(ctaLinkColumn("seller"), "reservation_entreprise_link");

  assert.equal(
    fallbackCtaLink("buyer"),
    "https://www.hercule.dev/reservation.html",
  );
  assert.equal(
    fallbackCtaLink("seller"),
    "https://www.hercule.dev/reservation-entreprise.html",
  );

  const buyerPrompt =
    "CTA: {reservation_agence_link} and {{reservation_agence_link}}";
  const buyerUrl = "https://www.hercule.dev/reservation.html/abc123";
  assert.equal(
    applyPromptLinkVariables(buyerPrompt, buyerUrl, "buyer"),
    `CTA: ${buyerUrl} and ${buyerUrl}`,
  );

  const sellerPrompt = "Book: {{reservation_entreprise_link}}";
  const sellerUrl = "https://www.hercule.dev/reservation-entreprise.html/xyz";
  assert.equal(
    applyPromptLinkVariables(sellerPrompt, sellerUrl, "seller"),
    `Book: ${sellerUrl}`,
  );

  console.log("lead-links.test.ts: OK");
}

main();
