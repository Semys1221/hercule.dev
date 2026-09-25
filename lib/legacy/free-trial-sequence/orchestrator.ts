import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";
import {
  scheduleLeadEmailJobs,
  sendProductEmailNow,
} from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { getAppBaseUrl } from "@/lib/legacy/payments/stripe";

const MS_DAY = 24 * 60 * 60 * 1000;

export const FREE_TRIAL_PITCH_EMAIL_TYPES: BookingEmailType[] = [
  "free_trial_1",
  "free_trial_2",
];

export const FREE_TRIAL_EMAIL_TYPES: BookingEmailType[] = [
  ...FREE_TRIAL_PITCH_EMAIL_TYPES,
  "free_trial_3",
];

export type StartFreeTrialSequenceParams = {
  leadId: string;
  /** Anchor for J+2 follow-up scheduling (defaults to now). */
  startsAt?: Date;
};

export type StartFreeTrialSequenceResult = {
  pitchSent: boolean;
  pitchError?: string;
  scheduledJobs: number;
};

function checkoutTrialLinkFor(): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return `${base}/proposition`;
}

export async function startFreeTrialSequence(
  params: StartFreeTrialSequenceParams,
): Promise<StartFreeTrialSequenceResult> {
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
  const startsAt = params.startsAt ?? new Date();
  const idempotencyPrefix = `free-trial:${params.leadId}:${startsAt.toISOString().slice(0, 10)}`;
  const checkoutTrialLink = checkoutTrialLinkFor();

  const profile = ((typedLead.profile ?? {}) as Record<string, unknown>) || {};
  await client
    .from("leads")
    .update({
      profile: {
        ...profile,
        free_trial_checkout_link: checkoutTrialLink,
      },
    })
    .eq("id", params.leadId);

  const pitch = await sendProductEmailNow({
    category: "comptable",
    leadId: params.leadId,
    emailType: "free_trial_1",
    triggeredBy: "free_trial_sequence",
    idempotencyKey: `${idempotencyPrefix}:1`,
    extra: { checkoutTrialLink },
  });

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "free_trial_2",
      scheduledFor: new Date(startsAt.getTime() + 2 * MS_DAY),
      idempotencyKey: `${idempotencyPrefix}:2`,
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

  return {
    pitchSent: pitch.ok,
    pitchError: pitch.error,
    scheduledJobs: inserted,
  };
}
