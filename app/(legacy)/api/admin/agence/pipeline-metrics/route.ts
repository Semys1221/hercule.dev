import { NextResponse } from "next/server";

import { OFFER_TYPES_CONFERENCE } from "@/lib/commercial/conference-pricing";
import { loadPipelineMetrics } from "@/lib/legacy/calendly/load-pipeline-metrics";
import { PIPELINE_PRODUCT_PRICE_EUR } from "@/lib/legacy/calendly/pipeline-dashboard";
import { CONFERENCE_PAYMENT_LINK_URLS } from "@/lib/legacy/payments/conference-payment-links";

export async function GET() {
  try {
    const metrics = await loadPipelineMetrics();
    return NextResponse.json(
      {
        metrics,
        product: {
          name: "Hercule DEC — conférence",
          priceEur: PIPELINE_PRODUCT_PRICE_EUR,
          paymentLinkUrl:
            CONFERENCE_PAYMENT_LINK_URLS[OFFER_TYPES_CONFERENCE.decMonthly],
          inscriptionPath: "/conference/inscription",
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "metrics fetch failed";
    console.error("[admin/agence/pipeline-metrics]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
