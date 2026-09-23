import { NextResponse } from "next/server";

import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { checkoutErrorResponse } from "@/lib/legacy/payments/checkout-errors";
import { createDecTrialEmbeddedCheckout } from "@/lib/legacy/payments/dec-trial-checkout-session";

export async function POST() {
  try {
    const client = createLinkTrackingClient();
    const result = await createDecTrialEmbeddedCheckout(client);
    return NextResponse.json({
      clientSecret: result.clientSecret,
      sessionId: result.sessionId,
      slug: result.slug,
    });
  } catch (error) {
    const { body: errorBody, status } = checkoutErrorResponse(
      error,
      "payments/checkout-dec-trial",
    );
    return NextResponse.json(errorBody, { status });
  }
}
