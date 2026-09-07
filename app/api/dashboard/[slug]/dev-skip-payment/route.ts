import { NextResponse } from "next/server";

import { isSeedSlug } from "@/lib/admin/clients/seed";
import { createLinkTrackingClient, findLeadByLink } from "@/lib/link-tracking/supabase";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { slug } = await params;
  const normalizedSlug = slug.trim();

  if (!normalizedSlug || !isSeedSlug(normalizedSlug)) {
    return NextResponse.json({ error: "Only seed test slugs are allowed" }, { status: 403 });
  }

  try {
    const client = createLinkTrackingClient();
    const lookup = await findLeadByLink(client, normalizedSlug);
    if (!lookup || lookup.category !== "agence") {
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
    }

    const agenceId = lookup.lead.id;
    const succeededAt = new Date().toISOString();
    const stripeCheckoutSessionId = `dev_skip_session_${normalizedSlug}`;

    const { error: paymentError } = await client.from("payments").upsert(
      {
        agence_id: agenceId,
        offer_type: "monthly_1489",
        amount_cents: 148900,
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "dev skip payment failed";
    console.error("[dashboard/dev-skip-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
