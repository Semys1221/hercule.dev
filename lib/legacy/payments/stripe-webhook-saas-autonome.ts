/**
 * Stripe webhook handler — SaaS autonome checkout completed.
 * Creates agence row (if needed), client_outreach_slot, inbox provision ticket.
 */

import type Stripe from "stripe";

import { buildProfileCapacityBlock } from "@/lib/legacy/capacity/compute-sla";
import { createClientSlotForAgence } from "@/lib/legacy/capacity/supabase";
import { buildDefaultProfile } from "@/lib/legacy/admin/profile-builder";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import { allocateSlugs, loadSlugSet } from "@/lib/legacy/link-tracking/slug";
import { buildDashboardUrl, buildLeadUrls } from "@/lib/legacy/link-tracking/urls";
import {
  SAAS_AUTONOME,
  isSaasAutonomeOfferType,
} from "@/lib/legacy/payments/saas-autonome-offers";
import { getBookingFromAddress } from "@/lib/legacy/booking-communication/templates";
import { getResendClient } from "@/lib/resend";

export function isSaasAutonomeCheckoutSession(
  session: Stripe.Checkout.Session,
): boolean {
  return (
    session.metadata?.product === SAAS_AUTONOME.metadataProduct ||
    isSaasAutonomeOfferType(session.metadata?.offer_type ?? "")
  );
}

export async function handleSaasAutonomeCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<{ slug: string; slotId: string; dashboardUrl: string }> {
  const client = createLinkTrackingClient();
  const email =
    session.customer_details?.email?.trim().toLowerCase() ||
    session.customer_email?.trim().toLowerCase();

  if (!email) {
    throw new Error("SaaS autonome checkout missing customer email");
  }

  // Idempotency via payments.stripe_event_id if payment_id present
  const paymentId = session.metadata?.payment_id;
  if (paymentId) {
    const { data: existing } = await client
      .from("payments")
      .select("id, stripe_event_id")
      .eq("id", paymentId)
      .maybeSingle();
    if (existing?.stripe_event_id === stripeEventId) {
      const { data: agence } = await client
        .from("agence")
        .select("slug, dashboard_link")
        .eq("email", email)
        .maybeSingle();
      const { data: slot } = await client
        .from("client_outreach_slots")
        .select("id")
        .eq("agence_id", session.metadata?.agence_id ?? "")
        .maybeSingle();
      return {
        slug: agence?.slug ?? "",
        slotId: slot?.id ?? "",
        dashboardUrl: agence?.dashboard_link ?? "",
      };
    }
  }

  let agenceId = session.metadata?.agence_id?.trim() || null;
  let slug = "";

  if (agenceId) {
    const { data: existingAgence } = await client
      .from("agence")
      .select("id, slug, dashboard_link")
      .eq("id", agenceId)
      .maybeSingle();
    if (existingAgence) {
      slug = existingAgence.slug;
    }
  }

  if (!agenceId || !slug) {
    const { data: byEmail } = await client
      .from("agence")
      .select("id, slug, dashboard_link")
      .eq("email", email)
      .maybeSingle();

    if (byEmail) {
      agenceId = byEmail.id;
      slug = byEmail.slug;
    } else {
      const slugSet = await loadSlugSet(client);
      const [newSlug] = allocateSlugs(slugSet, 1);
      slug = newSlug;
      const urls = buildLeadUrls(slug, email);
      const dashboardLink = buildDashboardUrl(slug);
      const profile = buildDefaultProfile({}, "agence");

      const { data: inserted, error } = await client
        .from("agence")
        .insert({
          email,
          slug,
          link: urls.reservation_agence_link,
          reservation_agence_link: urls.reservation_agence_link,
          confirmation_agence_link: urls.confirmation_agence_link,
          dashboard_link: dashboardLink,
          product_statut: "PAID_PENDING_ONBOARDING",
          profile,
        })
        .select("id, slug")
        .single();

      if (error || !inserted) {
        throw new Error(error?.message ?? "Failed to create agence lead");
      }
      agenceId = inserted.id;
      slug = inserted.slug;
    }
  }

  if (!agenceId) {
    throw new Error("SaaS autonome checkout could not resolve agence_id");
  }

  // Ensure slot exists
  const { data: existingSlot } = await client
    .from("client_outreach_slots")
    .select("id")
    .eq("agence_id", agenceId)
    .maybeSingle();

  let slotId = existingSlot?.id ?? "";
  if (!slotId) {
    const { slot } = await createClientSlotForAgence({
      client,
      agenceId,
    });
    slotId = slot.id;

    const capacityBlock = buildProfileCapacityBlock(slot);
    const { data: agenceRow } = await client
      .from("agence")
      .select("profile")
      .eq("id", agenceId)
      .maybeSingle();
    const profile =
      agenceRow?.profile && typeof agenceRow.profile === "object"
        ? { ...(agenceRow.profile as Record<string, unknown>) }
        : buildDefaultProfile({}, "agence");
    profile.capacity = capacityBlock;
    await client
      .from("agence")
      .update({
        profile,
        product_statut: "PAID_PENDING_ONBOARDING",
      })
      .eq("id", agenceId);
  }

  if (paymentId) {
    await client
      .from("payments")
      .update({
        status: "succeeded",
        stripe_event_id: stripeEventId,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        succeeded_at: new Date().toISOString(),
      })
      .eq("id", paymentId);
  }

  const dashboardUrl = buildDashboardUrl(slug);

  // Ops notification
  const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
  if (opsEmail) {
    try {
      await getResendClient().emails.send({
        from: getBookingFromAddress(),
        to: [opsEmail],
        subject: `SaaS autonome — nouveau client ${email}`,
        text: [
          `Checkout SaaS autonome confirmé.`,
          `Client : ${email}`,
          `Dashboard : ${dashboardUrl}`,
          `Slot : ${slotId}`,
          `Action : provisionner ${SAAS_AUTONOME.inboxAllocation} inbox → /internal/saas/inbox-queue`,
          `Session : ${session.id}`,
        ].join("\n"),
      });
    } catch (err) {
      console.error(
        "[stripe/webhook] saas autonome ops notification failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { slug, slotId, dashboardUrl };
}
