import { cancelPendingJobsForLead } from "@/lib/legacy/booking-communication/jobs";
import {
  scheduleLeadEmailJobs,
  sendProductEmailNow,
} from "@/lib/legacy/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/legacy/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/legacy/link-tracking/urls";
import { estimatedFirstBookingDateFromLead } from "@/lib/legacy/booking-communication/product-vars";

import {
  MS_DAY,
  PAYMENT_ONBOARDING_E2_OFFSET_MS,
  PAYMENT_ONBOARDING_EMAIL_TYPES,
  PAYMENT_ONBOARDING_NURTURE_DAY_OFFSETS,
  PAYMENT_ONBOARDING_SEQUENCE_SLUG,
  PAYMENT_ONBOARDING_TRIGGERED_BY,
} from "./constants";
import { estimateFirstRdvDateLabel } from "./estimate-rdv-date";
import { parisWallTime } from "./paris-time";
import { readPaymentOnboardingSequence } from "./sequences";
import type { StartPaymentOnboardingParams, StartPaymentOnboardingResult } from "./types";

function scheduledForStep(
  paymentAt: Date,
  stepIndex: number,
): Date {
  if (stepIndex === 1) {
    return new Date(paymentAt.getTime() + PAYMENT_ONBOARDING_E2_OFFSET_MS);
  }
  if (stepIndex === 2) {
    const slot = parisWallTime(paymentAt, 17, 0);
    return slot.getTime() > paymentAt.getTime() ? slot : paymentAt;
  }
  const nurtureIndex = stepIndex - 3;
  const dayOffset = PAYMENT_ONBOARDING_NURTURE_DAY_OFFSETS[nurtureIndex];
  return new Date(paymentAt.getTime() + dayOffset * MS_DAY);
}

export async function startPaymentOnboardingSequence(
  params: StartPaymentOnboardingParams,
): Promise<StartPaymentOnboardingResult> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, params.leadCategory, params.leadId);
  if (!lead) {
    throw new Error("lead_not_found");
  }

  const sequence = readPaymentOnboardingSequence(params.vertical);
  if (sequence.steps.length !== PAYMENT_ONBOARDING_EMAIL_TYPES.length) {
    throw new Error("payment_onboarding_sequence_step_count_mismatch");
  }

  const paymentAt = params.paymentAt;
  const idempotencyPrefix = `payment-onboarding:${params.stripeCheckoutSessionId}`;
  const dashboardLink =
    params.dashboardLink?.trim() || dashboardLinkFor(lead) || "";
  const estimatedFromLead = estimatedFirstBookingDateFromLead(lead);
  const estimatedFirstRdvDate =
    params.estimatedFirstRdvDate?.trim() ||
    estimatedFromLead ||
    estimateFirstRdvDateLabel(paymentAt);
  const recipientEmail = params.recipientEmail.trim() || lead.email;

  await cancelPendingJobsForLead(params.leadId, [
    "product_payment_welcome",
    ...PAYMENT_ONBOARDING_EMAIL_TYPES,
  ]);

  const extras = {
    dashboardLink,
    estimatedFirstRdvDate,
    estimatedFirstBookingDate: estimatedFirstRdvDate,
    email: recipientEmail,
  };

  const firstType = sequence.steps[0]?.emailType as BookingEmailType;
  const welcome = await sendProductEmailNow({
    category: params.leadCategory,
    leadId: params.leadId,
    emailType: firstType,
    triggeredBy: "stripe_payment",
    idempotencyKey: `${idempotencyPrefix}:1`,
    extra: extras,
  });

  const scheduledJobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [];

  for (let index = 1; index < sequence.steps.length; index += 1) {
    const step = sequence.steps[index];
    scheduledJobs.push({
      emailType: step.emailType as BookingEmailType,
      scheduledFor: scheduledForStep(paymentAt, index),
      idempotencyKey: `${idempotencyPrefix}:${index + 1}`,
    });
  }

  const { inserted } = await scheduleLeadEmailJobs({
    category: params.leadCategory,
    leadId: params.leadId,
    triggeredBy: PAYMENT_ONBOARDING_TRIGGERED_BY,
    jobs: scheduledJobs,
  });

  const { syncClientSequenceStarted } = await import(
    "@/lib/legacy/admin/management/recipients/hooks"
  );
  syncClientSequenceStarted({
    niche:
      params.vertical === "cif"
        ? "cif"
        : params.vertical === "ias"
          ? "entreprise"
          : "comptable",
    leadEmail: recipientEmail,
    leadId: params.leadId,
    sequenceSlug: PAYMENT_ONBOARDING_SEQUENCE_SLUG,
    currentStep: firstType,
  });

  return {
    welcomeSent: welcome.ok,
    scheduledJobs: inserted,
  };
}
