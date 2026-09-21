import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import {
  scheduleLeadEmailJobs,
  sendProductEmailNow,
} from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { dashboardLinkFor } from "@/lib/legacy/link-tracking/urls";
import { getAppBaseUrl, getStripeClient } from "@/lib/legacy/payments/stripe";

const MS_DAY = 24 * 60 * 60 * 1000;

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

export type StartFreeTrialStartedSequenceResult = {
  welcomeSent: boolean;
  scheduledJobs: number;
};

async function resolveBillingPortalLink(params: {
  stripeCustomerId?: string | null;
  leadSlug: string;
}): Promise<string> {
  const fallback = `${getAppBaseUrl()}/dashboard/${params.leadSlug}`;
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
    .from("comptable")
    .select("*")
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
    .from("comptable")
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

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "free_trial_started_2",
      scheduledFor: new Date(paymentAt.getTime() + 2 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:2`,
    },
    {
      emailType: "free_trial_started_3",
      scheduledFor: new Date(paymentAt.getTime() + 3 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:3`,
    },
  ];

  const { inserted } = await scheduleLeadEmailJobs({
    category: "comptable",
    leadId: params.leadId,
    triggeredBy: "free_trial_started_sequence",
    jobs,
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
    scheduledJobs: inserted,
  };
}
