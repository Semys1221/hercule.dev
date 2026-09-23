import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import { scheduleLeadEmailJobs } from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { dashboardLinkFor } from "@/lib/legacy/link-tracking/urls";
import { getAppBaseUrl } from "@/lib/legacy/payments/stripe";

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

function checkoutTrialLinkFor(_lead: LinkTrackingLead): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return `${base}/proposition#essai`;
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
    "@/lib/legacy/admin/management/recipients/hooks"
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
