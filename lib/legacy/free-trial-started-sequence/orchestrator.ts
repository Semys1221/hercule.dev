import { isClientResendAutoEmailsEnabled } from "@/lib/clients/resend-auto-emails";
import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { sendProductEmailNow } from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { dashboardLinkFor } from "@/lib/legacy/link-tracking/urls";
import { getAppBaseUrl, getStripeClient } from "@/lib/legacy/payments/stripe";

export const FREE_TRIAL_STARTED_EMAIL_TYPES: BookingEmailType[] = [
  "free_trial_started_1",
  "free_trial_started_2",
  "free_trial_started_3",
];

export type StartFreeTrialStartedSequenceParams = {
  leadId: string;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
  stripeCustomerId?: string | null;
};

export type StartFreeTrialStartedSequenceForClientParams = {
  clientId: string;
  slug: string;
  email: string;
  firstName: string | null;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
  stripeCustomerId?: string | null;
};

export type StartFreeTrialStartedSequenceResult = {
  welcomeSent: boolean;
  scheduledJobs: number;
};

async function resolveBillingPortalLink(params: {
  stripeCustomerId?: string | null;
  leadSlug: string;
  returnPath?: string;
}): Promise<string> {
  const fallback =
    params.returnPath?.trim() || `${getAppBaseUrl()}/dashboard/${params.leadSlug}`;
  const customerId = params.stripeCustomerId?.trim();
  if (!customerId) {
    return fallback;
  }
  try {
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: fallback,
    });
    return session.url || fallback;
  } catch (error) {
    console.error(
      "[free-trial-started] billing portal session failed:",
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

export async function startFreeTrialStartedSequence(
  params: StartFreeTrialStartedSequenceParams,
): Promise<StartFreeTrialStartedSequenceResult> {
  const client = createLinkTrackingClient();
  const { data: lead } = await client
    .from("leads")
    .select("*")
    .eq("category", "comptable")
    .eq("id", params.leadId)
    .maybeSingle();

  if (!lead) {
    throw new Error("lead_not_found");
  }

  const typedLead = lead as LinkTrackingLead;
  const paymentAt = params.paymentAt;
  const idempotencyPrefix = `free-trial-started:${params.stripeCheckoutSessionId}`;
  const dashboardLink = dashboardLinkFor(typedLead) ?? "";
  const billingPortalLink = await resolveBillingPortalLink({
    stripeCustomerId: params.stripeCustomerId,
    leadSlug: typedLead.slug?.trim() || params.leadId,
  });

  const profile = ((typedLead.profile ?? {}) as Record<string, unknown>) || {};
  await client
    .from("leads")
    .update({
      profile: {
        ...profile,
        free_trial_billing_portal_link: billingPortalLink,
      },
    })
    .eq("id", params.leadId);

  const extras = {
    dashboardLink,
    billingPortalLink,
  };

  const welcome = await sendProductEmailNow({
    category: "comptable",
    leadId: params.leadId,
    emailType: "free_trial_started_1",
    triggeredBy: "stripe_payment",
    idempotencyKey: `${idempotencyPrefix}:1`,
    extra: extras,
  });

  const { syncClientSequenceStarted } = await import(
    "@/lib/legacy/admin/management/recipients/hooks"
  );
  syncClientSequenceStarted({
    niche: "comptable",
    leadEmail: typedLead.email,
    leadId: params.leadId,
    sequenceSlug: "free-trial-started",
    currentStep: "free_trial_started_1",
  });

  return {
    welcomeSent: welcome.ok,
    scheduledJobs: 0,
  };
}

/** DEC free trial on public.clients — dashboard /clients/[slug], category client. */
export async function startFreeTrialStartedSequenceForClient(
  params: StartFreeTrialStartedSequenceForClientParams,
): Promise<StartFreeTrialStartedSequenceResult> {
  const client = createLinkTrackingClient();
  const paymentAt = params.paymentAt;
  const idempotencyPrefix = `free-trial-started:client:${params.stripeCheckoutSessionId}`;
  const dashboardLink = `${getAppBaseUrl()}/clients/${params.slug}`;
  const billingPortalLink = await resolveBillingPortalLink({
    stripeCustomerId: params.stripeCustomerId,
    leadSlug: params.slug,
    returnPath: dashboardLink,
  });

  const { data: row } = await client
    .from("clients")
    .select("profile")
    .eq("id", params.clientId)
    .maybeSingle();

  const profile = ((row?.profile ?? {}) as Record<string, unknown>) || {};
  if (!isClientResendAutoEmailsEnabled(profile)) {
    return { welcomeSent: false, scheduledJobs: 0 };
  }

  await client
    .from("clients")
    .update({
      profile: {
        ...profile,
        free_trial_billing_portal_link: billingPortalLink,
      },
    })
    .eq("id", params.clientId);

  const extras = {
    dashboardLink,
    billingPortalLink,
  };

  const welcome = await sendProductEmailNow({
    category: "client",
    leadId: params.clientId,
    emailType: "free_trial_started_1",
    triggeredBy: "stripe_payment",
    idempotencyKey: `${idempotencyPrefix}:1`,
    extra: extras,
  });

  if (params.email) {
    const { syncClientSequenceStarted } = await import(
      "@/lib/legacy/admin/management/recipients/hooks"
    );
    syncClientSequenceStarted({
      niche: "comptable",
      leadEmail: params.email,
      leadId: params.clientId,
      sequenceSlug: "free-trial-started",
      currentStep: "free_trial_started_1",
    });
  }

  return {
    welcomeSent: welcome.ok,
    scheduledJobs: 0,
  };
}
