import { NextResponse } from "next/server";

import { isSeedSlug } from "@/lib/admin/clients/seed";
import { isSalesTestSessionSlug } from "@/lib/admin/funnels/sales-test-session-preset";
import { COMMERCIAL_COMPTABLE, OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";
import { createLinkTrackingClient, findLeadByLink } from "@/lib/link-tracking/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

function devSkipAllowedInProduction(slug: string): boolean {
  return isSalesTestSessionSlug(slug);
}

async function skipAgencePayment(
  client: ReturnType<typeof createLinkTrackingClient>,
  agenceId: string,
  normalizedSlug: string,
  body: { offerType?: string },
): Promise<void> {
  const succeededAt = new Date().toISOString();
  const stripeCheckoutSessionId = `dev_skip_session_${normalizedSlug}`;

  let offerType = "starter_998_5";
  let amountCents = 49_900;
  if (body.offerType === "growth_1498_10") {
    offerType = "growth_1498_10";
    amountCents = 74_900;
  }

  const { error: paymentError } = await client.from("payments").upsert(
    {
      agence_id: agenceId,
      offer_type: offerType,
      amount_cents: amountCents,
      payment_phase: "deposit",
      status: "succeeded",
      stripe_checkout_session_id: stripeCheckoutSessionId,
      succeeded_at: succeededAt,
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const { error: statutError } = await client
    .from("agence")
    .update({ product_statut: "PAID_PENDING_ONBOARDING" })
    .eq("id", agenceId);

  if (statutError) {
    throw new Error(statutError.message);
  }

  await client
    .from("sales_calls")
    .update({ status: "paid" })
    .eq("agence_id", agenceId)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);
}

async function skipComptablePayment(
  client: ReturnType<typeof createLinkTrackingClient>,
  comptableId: string,
  normalizedSlug: string,
  body: { offerType?: string },
): Promise<void> {
  const succeededAt = new Date().toISOString();
  const stripeCheckoutSessionId = `dev_skip_session_${normalizedSlug}`;

  let offerType: string = OFFER_TYPES_COMPTABLE.monthly1499;
  let amountCents: number = COMMERCIAL_COMPTABLE.growthMonthlyPriceCents;
  if (body.offerType === OFFER_TYPES_COMPTABLE.starter999_5) {
    offerType = OFFER_TYPES_COMPTABLE.starter999_5;
    amountCents = COMMERCIAL_COMPTABLE.starterPriceCents;
  } else if (body.offerType === OFFER_TYPES_COMPTABLE.pack3x1499) {
    offerType = OFFER_TYPES_COMPTABLE.pack3x1499;
    amountCents = COMMERCIAL_COMPTABLE.pack3TotalCents;
  }

  const { error: paymentError } = await client.from("payments").upsert(
    {
      comptable_id: comptableId,
      offer_type: offerType,
      amount_cents: amountCents,
      status: "succeeded",
      stripe_checkout_session_id: stripeCheckoutSessionId,
      succeeded_at: succeededAt,
    },
    { onConflict: "stripe_checkout_session_id" },
  );

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  await client
    .from("sales_calls")
    .update({ status: "paid" })
    .eq("comptable_id", comptableId)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);
}

export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();

  if (!normalizedSlug || !isSeedSlug(normalizedSlug)) {
    return NextResponse.json({ error: "Only seed test slugs are allowed" }, { status: 403 });
  }

  if (
    process.env.NODE_ENV === "production" &&
    !devSkipAllowedInProduction(normalizedSlug)
  ) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  let body: { offerType?: string } = {};
  try {
    body = (await request.json()) as { offerType?: string };
  } catch {
    // optional body
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, normalizedSlug);
    if (!lookup) {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "de73f5",
      },
      body: JSON.stringify({
        sessionId: "de73f5",
        runId: "post-fix",
        hypothesisId: "C,D",
        location: "dev-skip-payment/route.ts:POST",
        message: "dev skip payment request",
        data: {
          slug: normalizedSlug,
          category: lookup.category,
          offerType: body.offerType ?? null,
          production: process.env.NODE_ENV === "production",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (lookup.category === "agence") {
      await skipAgencePayment(client, lookup.lead.id, normalizedSlug, body);
      return NextResponse.json({ ok: true });
    }

    if (lookup.category === "comptable") {
      await skipComptablePayment(client, lookup.lead.id, normalizedSlug, body);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dev skip payment failed";
    console.error("[dashboard/dev-skip-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
