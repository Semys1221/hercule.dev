import { NextResponse } from "next/server";
import Stripe from "stripe";

import { revalidateBookingsCache } from "@/lib/calendly/bookings-cache";
import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/payments/stripe";
import {
  handleComptableCheckoutCompleted,
  handleComptableInvoicePaid,
  handleComptableSubscriptionDeleted,
} from "@/lib/payments/stripe-webhook-comptable";
import {
  insertJob,
  markJobFailed,
  markJobSent,
} from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import {
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "@/lib/booking-communication/template-store";
import { defaultUseHtml } from "@/lib/booking-communication/signatures";
import { prepareThreadedSend } from "@/lib/booking-communication/threaded-send";

async function handleAgenceCheckoutCompleted(
  client: ReturnType<typeof createLinkTrackingClient>,
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<void> {
  const paymentId = session.metadata?.payment_id;
  const agenceId = session.metadata?.agence_id;

  if (!paymentId || !agenceId) {
    return;
  }

  const { data: existingPayment } = await client
    .from("payments")
    .select("id, status, stripe_event_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (existingPayment?.stripe_event_id === stripeEventId) {
    return;
  }

  const succeededAt = new Date().toISOString();
  const { error: paymentError } = await client
    .from("payments")
    .update({
      status: "succeeded",
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      stripe_event_id: stripeEventId,
      succeeded_at: succeededAt,
    })
    .eq("id", paymentId);

  if (paymentError) {
    throw new Error(paymentError.message);
  }

  const paymentPhase = session.metadata?.payment_phase ?? "deposit";
  if (paymentPhase === "balance") {
    return;
  }

  await client
    .from("agence")
    .update({ product_statut: "PAID_PENDING_ONBOARDING" })
    .eq("id", agenceId);

  await client
    .from("sales_calls")
    .update({ status: "paid" })
    .eq("agence_id", agenceId)
    .in("status", ["scheduled", "not_paid", "completed", "no_show"]);

  await client
    .from("booking_email_jobs")
    .update({ status: "cancelled" })
    .eq("lead_id", agenceId)
    .eq("status", "pending")
    .in("email_type", [
      "close_indecis_1",
      "close_indecis_2",
      "close_indecis_3",
      "no_show_indecis_1",
      "no_show_indecis_2",
      "no_show_indecis_3",
    ]);

  revalidateBookingsCache();

  try {
    const { data: agenceLead } = await client
      .from("agence")
      .select("id, email, first_name, company, slug, dashboard_link")
      .eq("id", agenceId)
      .single();

    if (agenceLead) {
      const emailType = "product_payment_welcome" as const;
      const idempotencyKey = `payment:welcome:${agenceId}`;
      const dashboardLink =
        dashboardLinkFor({
          slug: agenceLead.slug,
          dashboard_link: agenceLead.dashboard_link,
        }) ?? `https://www.hercule.dev/dashboard/${agenceLead.slug}`;

      const template = await resolveBookingEmailTemplate({
        category: "agence",
        emailType,
      });

      const rendered = await renderCustomBookingEmail({
        subject: template.subject,
        body: template.body,
        category: "agence",
        emailType,
        firstName: agenceLead.first_name,
        scheduledAt: null,
        confirmUrl: "",
        dashboardLink,
        company: agenceLead.company,
        email: agenceLead.email,
        useHtml: defaultUseHtml(emailType),
      });

      const now = new Date();
      const job = await insertJob({
        category: "agence",
        leadId: agenceLead.id,
        emailType,
        scheduledFor: now,
        triggeredBy: "stripe_payment",
        idempotencyKey,
        useHtml: defaultUseHtml(emailType),
      });

      const threaded = await prepareThreadedSend(
        { email_type: emailType, lead_id: agenceLead.id },
        rendered,
      );

      const sendResult = await sendBookingEmail({
        to: agenceLead.email,
        subject: threaded.subject,
        text: rendered.text,
        html: rendered.html,
        idempotencyKey,
        headers: threaded.headers,
      });

      if (sendResult.ok && job) {
        await markJobSent(job.id, sendResult.id, {
          messageId: sendResult.messageId,
          threadSubject: threaded.threadSubject,
        });
      } else if (!sendResult.ok && job) {
        await markJobFailed(job.id, sendResult.error);
      }

      try {
        const { sendProductEmailNow } = await import(
          "@/lib/booking-communication/product-send"
        );
        await sendProductEmailNow({
          category: "agence",
          leadId: agenceLead.id,
          emailType: "payment_notification_client",
          triggeredBy: "stripe_payment_notification",
          idempotencyKey: `payment:notification:${agenceId}`,
          extra: { dashboardLink },
        });
      } catch (notifyError) {
        console.error(
          "[stripe/webhook] payment notification client failed:",
          notifyError instanceof Error ? notifyError.message : notifyError,
        );
      }

      const opsEmail = process.env.NOTIFICATION_OPS_EMAIL?.trim();
      if (opsEmail) {
        try {
          const { getResendClient } = await import("@/lib/resend");
          const { getBookingFromAddress } = await import(
            "@/lib/booking-communication/templates"
          );
          await getResendClient().emails.send({
            from: getBookingFromAddress(),
            to: [opsEmail],
            subject: `Paiement reçu — ${agenceLead.company ?? agenceLead.email}`,
            text: `Paiement confirmé pour ${agenceLead.email} (${agenceLead.company ?? "—"})\nDashboard: ${dashboardLink}`,
          });
        } catch (opsError) {
          console.error(
            "[stripe/webhook] ops payment notification failed:",
            opsError instanceof Error ? opsError.message : opsError,
          );
        }
      }
    }
  } catch (emailError) {
    console.error(
      "[stripe/webhook] payment welcome email failed:",
      emailError instanceof Error ? emailError.message : emailError,
    );
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    console.error("[stripe/webhook]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const client = createLinkTrackingClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const comptableId = session.metadata?.comptable_id;
      const entrepriseId = session.metadata?.entreprise_id;
      const cifId = session.metadata?.cif_id;
      const agenceId = session.metadata?.agence_id;

      if (comptableId || entrepriseId || cifId) {
        const handled = await handleComptableCheckoutCompleted(
          client,
          session,
          event.id,
        );
        if (handled) {
          return NextResponse.json({ ok: true });
        }
      }

      if (agenceId) {
        await handleAgenceCheckoutCompleted(client, session, event.id);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true, ignored: "missing_metadata" });
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const handled = await handleComptableInvoicePaid(client, invoice, event.id);
      return NextResponse.json({ ok: true, handled });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const handled = await handleComptableSubscriptionDeleted(client, subscription);
      return NextResponse.json({ ok: true, handled });
    }

    return NextResponse.json({ ok: true, ignored: event.type });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handling failed";
    console.error("[stripe/webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
