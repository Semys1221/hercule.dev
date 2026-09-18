import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { scheduleLeadEmailJobs, sendProductEmailNow } from "@/lib/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import { formatMeetingDateTime } from "@/lib/booking-communication/templates";
import { trackingNumberForSlug } from "@/lib/comptable-acquisition-sequence/dates";

const MS_HOUR = 60 * 60 * 1000;

/** First meeting estimated J+20 (not J+25 like the generic acquisition). */
const PROPOSITION_LUDOVIC_FIRST_RDV_DAYS = 20;

export type PropositionLudovicPayment = {
  /** "formule-test-15" | "formule-croissance-45" */
  offerId: string;
  /** e.g. "Formule Test — 15 profils" */
  offerLabel: string;
  /** Number of profiles per month */
  profileVolume: number;
  /** e.g. "1 489 € / mois" */
  amountLabel: string;
};

export type StartPropositionLudovicSequenceParams = {
  leadId: string;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
  payment: PropositionLudovicPayment;
};

export type StartPropositionLudovicSequenceResult = {
  welcomeSent: boolean;
  scheduledJobs: number;
};

function estimatedFirstRdvAt(paymentAt: Date): Date {
  return new Date(paymentAt.getTime() + PROPOSITION_LUDOVIC_FIRST_RDV_DAYS * 24 * MS_HOUR);
}

function formatEstimatedFirstRdvDate(paymentAt: Date): string {
  return formatMeetingDateTime(estimatedFirstRdvAt(paymentAt).toISOString()).date;
}

async function persistLeadData(
  leadId: string,
  paymentAt: Date,
  payment: PropositionLudovicPayment,
): Promise<void> {
  const client = createLinkTrackingClient();
  const estimatedIso = estimatedFirstRdvAt(paymentAt).toISOString();

  const { data: row } = await client
    .from("comptable")
    .select("profile")
    .eq("id", leadId)
    .maybeSingle();

  const profile = ((row?.profile ?? {}) as Record<string, unknown>) || {};
  const dashboard = ((profile.dashboard ?? {}) as Record<string, unknown>) || {};

  const nextProfile = {
    ...profile,
    estimated_first_booking_at: estimatedIso,
    dashboard: {
      ...dashboard,
      estimated_first_booking_at: estimatedIso,
    },
    proposition_payment: {
      slug: "ludovic",
      offerId: payment.offerId,
      offerLabel: payment.offerLabel,
      profileVolume: payment.profileVolume,
      amountLabel: payment.amountLabel,
    },
  };

  await client.from("comptable").update({ profile: nextProfile }).eq("id", leadId);
}

function emailExtras(
  lead: LinkTrackingLead,
  paymentAt: Date,
  payment: PropositionLudovicPayment,
) {
  const slug = lead.slug?.trim() ?? "";
  const estimatedFirstRdvDate = formatEstimatedFirstRdvDate(paymentAt);
  return {
    dashboardLink: dashboardLinkFor(lead) ?? "",
    trackingNumber: trackingNumberForSlug(slug),
    estimatedFirstRdvDate,
    estimatedFirstBookingDate: estimatedFirstRdvDate,
    profileVolume: String(payment.profileVolume),
    offerLabel: payment.offerLabel,
    amountLabel: payment.amountLabel,
  };
}

export async function startPropositionLudovicSequence(
  params: StartPropositionLudovicSequenceParams,
): Promise<StartPropositionLudovicSequenceResult> {
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
  const { paymentAt, payment, stripeCheckoutSessionId } = params;
  const idempotencyPrefix = `proposition-ludovic:${stripeCheckoutSessionId}`;

  await persistLeadData(params.leadId, paymentAt, payment);

  const extras = emailExtras(typedLead, paymentAt, payment);

  const welcome = await sendProductEmailNow({
    category: "comptable",
    leadId: params.leadId,
    emailType: "proposition_ludovic_welcome",
    triggeredBy: "stripe_payment",
    idempotencyKey: `${idempotencyPrefix}:welcome`,
    extra: extras,
  });

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "proposition_ludovic_config_ready",
      scheduledFor: new Date(paymentAt.getTime() + 24 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:config_ready`,
    },
    {
      emailType: "proposition_ludovic_rdv_reminder",
      scheduledFor: new Date(paymentAt.getTime() + 48 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:rdv_reminder`,
    },
    {
      emailType: "proposition_ludovic_rdv_final",
      scheduledFor: new Date(paymentAt.getTime() + 5 * 24 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:rdv_final`,
    },
  ];

  const { inserted } = await scheduleLeadEmailJobs({
    category: "comptable",
    leadId: params.leadId,
    triggeredBy: "proposition_ludovic_sequence",
    jobs,
  });

  const { syncClientSequenceStarted } = await import(
    "@/lib/admin/management/recipients/hooks"
  );
  syncClientSequenceStarted({
    niche: "comptable",
    leadEmail: typedLead.email,
    leadId: params.leadId,
    sequenceSlug: "proposition-ludovic-post-payment",
    currentStep: "proposition_ludovic_welcome",
  });

  return {
    welcomeSent: welcome.ok,
    scheduledJobs: inserted,
  };
}
