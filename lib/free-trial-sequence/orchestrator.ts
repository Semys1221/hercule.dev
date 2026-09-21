import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { scheduleLeadEmailJobs } from "@/lib/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import { getAppBaseUrl } from "@/lib/payments/stripe";
import { buildFreeTrialCheckoutDashboardUrl } from "@/lib/payments/cabinet-checkout";
import { OFFER_TYPES_COMPTABLE } from "@/lib/commercial/constants";

const MS_DAY = 24 * 60 * 60 * 1000;

export const FREE_TRIAL_EMAIL_TYPES: BookingEmailType[] = [
  "free_trial_1",
  "free_trial_2",
  "free_trial_3",
];

export type StartFreeTrialSequenceParams = {
  leadId: string;
  /** Anchor for J+1 / J+2 / J+3 scheduling (defaults to now). */
  startsAt?: Date;
};

export type StartFreeTrialSequenceResult = {
  scheduledJobs: number;
};

function checkoutTrialLinkFor(lead: LinkTrackingLead): string {
  const base = dashboardLinkFor(lead)?.replace(/\/$/, "") ?? "";
  if (!base) {
    return `${getAppBaseUrl()}/comptable?offer=${OFFER_TYPES_COMPTABLE.monthly1499Trial}`;
  }
  try {
    return buildFreeTrialCheckoutDashboardUrl(base);
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}checkout=1&offer=${OFFER_TYPES_COMPTABLE.monthly1499Trial}`;
  }
}

export async function startFreeTrialSequence(
  params: StartFreeTrialSequenceParams,
): Promise<StartFreeTrialSequenceResult> {
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
  const startsAt = params.startsAt ?? new Date();
  const idempotencyPrefix = `free-trial:${params.leadId}:${startsAt.toISOString().slice(0, 10)}`;
  const checkoutTrialLink = checkoutTrialLinkFor(typedLead);
  const dashboardLink = dashboardLinkFor(typedLead) ?? "";

  // Persist CTA extras on profile so cron renders can resolve checkoutTrialLink
  const profile = ((typedLead.profile ?? {}) as Record<string, unknown>) || {};
  await client
    .from("comptable")
    .update({
      profile: {
        ...profile,
        free_trial_checkout_link: checkoutTrialLink,
      },
    })
    .eq("id", params.leadId);

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "free_trial_1",
      scheduledFor: new Date(startsAt.getTime() + 1 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:1`,
    },
    {
      emailType: "free_trial_2",
      scheduledFor: new Date(startsAt.getTime() + 2 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:2`,
    },
    {
      emailType: "free_trial_3",
      scheduledFor: new Date(startsAt.getTime() + 3 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:3`,
    },
  ];

  const { inserted } = await scheduleLeadEmailJobs({
    category: "comptable",
    leadId: params.leadId,
    triggeredBy: "free_trial_sequence",
    jobs,
  });

  const { syncClientSequenceStarted } = await import(
    "@/lib/admin/management/recipients/hooks"
  );
  syncClientSequenceStarted({
    niche: "comptable",
    leadEmail: typedLead.email,
    leadId: params.leadId,
    sequenceSlug: "free-trial",
    currentStep: "free_trial_1",
  });

  void dashboardLink;

  return { scheduledJobs: inserted };
}
