import { NextResponse } from "next/server";

import { buildClientDashboardUrl, createClientsClient, findClientBySlug } from "@/lib/clients/supabase";
import { createConferenceBillingPortalUrl } from "@/lib/legacy/payments/stripe-webhook-conference";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const client = createClientsClient();
    const row = await findClientBySlug(client, normalizedSlug);
    if (!row) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (row.billing !== "monthly" || !row.stripe_customer_id) {
      return NextResponse.json({ error: "Billing portal unavailable" }, { status: 400 });
    }

    const url = await createConferenceBillingPortalUrl({
      stripeCustomerId: row.stripe_customer_id,
      returnUrl: buildClientDashboardUrl(row.slug),
    });

    if (!url) {
      return NextResponse.json({ error: "Portal creation failed" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portal failed";
    console.error("[api/clients/slug/billing-portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
