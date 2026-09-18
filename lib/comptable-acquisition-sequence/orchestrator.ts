import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { scheduleLeadEmailJobs, sendProductEmailNow } from "@/lib/booking-communication/product-send";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";

import {
  acquisitionRdvRangeLabel,
  estimatedFirstRdvAtFromPayment,
  formatEstimatedFirstRdvDate,
  trackingNumberForSlug,
} from "./dates";

const MS_HOUR = 60 * 60 * 1000;

export type StartComptableAcquisitionSequenceParams = {
  leadId: string;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
};

export type StartComptableAcquisitionSequenceResult = {
  welcomeSent: boolean;
  scheduledJobs: number;
};

async function persistEstimatedFirstRdvAt(
  leadId: string,
  paymentAt: Date,
): Promise<void> {
  const client = createLinkTrackingClient();
  const estimatedIso = estimatedFirstRdvAtFromPayment(paymentAt).toISOString();

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
  };

  await client.from("comptable").update({ profile: nextProfile }).eq("id", leadId);
}

function emailExtras(lead: LinkTrackingLead, paymentAt: Date) {
  const slug = lead.slug?.trim() ?? "";
  const estimatedFirstRdvDate = formatEstimatedFirstRdvDate(paymentAt);
  return {
    dashboardLink: dashboardLinkFor(lead) ?? "",
    trackingNumber: trackingNumberForSlug(slug),
    estimatedFirstRdvDate,
    estimatedFirstBookingDate: estimatedFirstRdvDate,
    rdvRangeLabel: acquisitionRdvRangeLabel(),
  };
}

export async function startComptableAcquisitionSequence(
  params: StartComptableAcquisitionSequenceParams,
): Promise<StartComptableAcquisitionSequenceResult> {
  const client = createLinkTrackingClient();
  const { data: lead } = await client
    .from("comptable")
    .select("*")
    .eq("id", params.leadId)
    .maybeSingle();

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "abd286",
    },
    body: JSON.stringify({
      sessionId: "abd286",
      runId: "orchestrator",
      hypothesisId: "A",
      location: "orchestrator.ts:startComptableAcquisitionSequence",
      message: "sequence entry",
      data: {
        leadId: params.leadId,
        leadFound: Boolean(lead),
        slug: lead?.slug ?? null,
        stripeSessionId: params.stripeCheckoutSessionId,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!lead) {
    throw new Error("lead_not_found");
  }

  const typedLead = lead as LinkTrackingLead;
  const paymentAt = params.paymentAt;
  const idempotencyPrefix = `comptable-acquisition:${params.stripeCheckoutSessionId}`;

  await persistEstimatedFirstRdvAt(params.leadId, paymentAt);

  const extras = emailExtras(typedLead, paymentAt);

  const welcome = await sendProductEmailNow({
    category: "comptable",
    leadId: params.leadId,
    emailType: "comptable_acquisition_welcome",
    triggeredBy: "stripe_payment",
    idempotencyKey: `${idempotencyPrefix}:welcome`,
    extra: extras,
  });

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "abd286",
    },
    body: JSON.stringify({
      sessionId: "abd286",
      runId: "orchestrator",
      hypothesisId: "B",
      location: "orchestrator.ts:startComptableAcquisitionSequence",
      message: "welcome send result",
      data: {
        ok: welcome.ok,
        error: welcome.error ?? null,
        trackingNumber: extras.trackingNumber,
        estimatedFirstRdvDate: extras.estimatedFirstRdvDate,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }> = [
    {
      emailType: "comptable_acquisition_config_ready",
      scheduledFor: new Date(paymentAt.getTime() + 24 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:config_ready`,
    },
    {
      emailType: "comptable_acquisition_rdv_reminder",
      scheduledFor: new Date(paymentAt.getTime() + 48 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:rdv_reminder`,
    },
    {
      emailType: "comptable_acquisition_rdv_final",
      scheduledFor: new Date(paymentAt.getTime() + 5 * 24 * MS_HOUR),
      idempotencyKey: `${idempotencyPrefix}:rdv_final`,
    },
  ];

  const { inserted } = await scheduleLeadEmailJobs({
    category: "comptable",
    leadId: params.leadId,
    triggeredBy: "comptable_acquisition_sequence",
    jobs,
  });

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "abd286",
    },
    body: JSON.stringify({
      sessionId: "abd286",
      runId: "orchestrator",
      hypothesisId: "C",
      location: "orchestrator.ts:startComptableAcquisitionSequence",
      message: "jobs scheduled",
      data: {
        inserted,
        jobCount: jobs.length,
        scheduledFor: jobs.map((job) => job.scheduledFor.toISOString()),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const { syncClientSequenceStarted } = await import(
    "@/lib/admin/management/recipients/hooks"
  );
  syncClientSequenceStarted({
    niche: "comptable",
    leadEmail: typedLead.email,
    leadId: params.leadId,
    sequenceSlug: "comptable-acquisition-post-payment",
    currentStep: "comptable_acquisition_welcome",
  });

  return {
    welcomeSent: welcome.ok,
    scheduledJobs: inserted,
  };
}
