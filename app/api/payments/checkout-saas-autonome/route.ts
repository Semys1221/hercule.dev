import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/link-tracking/slug";
import { buildDashboardUrl, buildLeadUrls } from "@/lib/link-tracking/urls";
import { buildDefaultProfile } from "@/lib/admin/profile-builder";
import { checkoutErrorResponse } from "@/lib/payments/checkout-errors";
import {
  SAAS_AUTONOME,
  getSaasAutonomePriceId,
} from "@/lib/payments/saas-autonome-offers";
import {
  getAppBaseUrl,
  getCheckoutBrandingSettings,
  getStripeClient,
} from "@/lib/payments/stripe";

const bodySchema = z.object({
  email: z.string().email(),
  companyName: z.string().optional(),
});

/**
 * Self-serve SaaS autonome checkout — no prior sales call required.
 * Creates (or reuses) agence lead + payment row, returns Stripe embedded client_secret.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const priceId = getSaasAutonomePriceId();
  if (!priceId) {
    return NextResponse.json(
      {
        error:
          "STRIPE_PRICE_SAAS_AUTONOME (or growth deposit fallback) is not configured",
      },
      { status: 500 },
    );
  }

  try {
    const client = createLinkTrackingClient();
    const email = parsed.data.email.trim().toLowerCase();
    const stripe = getStripeClient();
    const baseUrl = getAppBaseUrl();

    let agenceId: string;
    let slug: string;

    const { data: existing } = await client
      .from("agence")
      .select("id, slug")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      agenceId = existing.id;
      slug = existing.slug;
    } else {
      const slugSet = await loadSlugSet(client);
      const [newSlug] = allocateSlugs(slugSet, 1);
      slug = newSlug;
      const urls = buildLeadUrls(slug, email);
      const profile = buildDefaultProfile(
        parsed.data.companyName
          ? { company_name: parsed.data.companyName }
          : {},
        "agence",
      );

      const { data: inserted, error } = await client
        .from("agence")
        .insert({
          email,
          slug,
          link: urls.reservation_agence_link,
          reservation_agence_link: urls.reservation_agence_link,
          confirmation_agence_link: urls.confirmation_agence_link,
          dashboard_link: buildDashboardUrl(slug),
          profile,
        })
        .select("id, slug")
        .single();

      if (error || !inserted) {
        throw new Error(error?.message ?? "Failed to create agence");
      }
      agenceId = inserted.id;
    }

    const integrationId = `saas_${randomBytes(8).toString("hex")}`;
    const { data: payment, error: paymentError } = await client
      .from("payments")
      .insert({
        agence_id: agenceId,
        offer_type: SAAS_AUTONOME.offerType,
        payment_phase: "full",
        amount_cents: SAAS_AUTONOME.monthlyPriceCents,
        status: "pending",
        integration_identifier: integrationId,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      throw new Error(paymentError?.message ?? "Failed to create payment");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: [{ price: priceId, quantity: 1 }],
      return_url: `${baseUrl}/dashboard/${slug}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: email,
      metadata: {
        product: SAAS_AUTONOME.metadataProduct,
        offer_type: SAAS_AUTONOME.offerType,
        payment_id: payment.id,
        agence_id: agenceId,
        payment_phase: "full",
      },
      ...getCheckoutBrandingSettings(),
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      slug,
      dashboardUrl: buildDashboardUrl(slug),
      offerType: SAAS_AUTONOME.offerType,
    });
  } catch (err) {
    const { body, status } = checkoutErrorResponse(
      err,
      "payments/checkout-saas-autonome",
    );
    return NextResponse.json(body, { status });
  }
}
