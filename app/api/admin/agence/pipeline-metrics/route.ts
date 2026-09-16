import { NextResponse } from "next/server";

import { loadPipelineMetrics } from "@/lib/calendly/load-pipeline-metrics";
import { PIPELINE_PRODUCT_PRICE_EUR } from "@/lib/calendly/pipeline-dashboard";
import { HERCULE_LIBERAL } from "@/lib/commercial/constants";
import { paymentLinkUrlForHerculeLiberal } from "@/lib/payments/hercule-liberal-offers";

export async function GET() {
  try {
    const metrics = await loadPipelineMetrics();
    return NextResponse.json(
      {
        metrics,
        product: {
          name: HERCULE_LIBERAL.productName,
          priceEur: PIPELINE_PRODUCT_PRICE_EUR,
          paymentLinkUrl: paymentLinkUrlForHerculeLiberal(),
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
