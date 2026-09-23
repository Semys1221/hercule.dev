import { createLinkTrackingClient, findLeadById } from "@/lib/legacy/link-tracking/supabase";
import { dashboardLinkFor, reservationAgenceLinkFor } from "@/lib/legacy/link-tracking/urls";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";
import { isClientResendAutoEmailsEnabled } from "@/lib/clients/resend-auto-emails";

import { insertJob, markJobFailed, markJobSent } from "./jobs";
import { sendBookingEmail } from "./send";
import { defaultUseHtml } from "./signatures";
import { prepareThreadedSend } from "./threaded-send";
import {
  confirmUrlForLead,
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "./template-store";
import { extraVarsForJob } from "./product-vars";
import type { BookingEmailType, SequenceTriggeredBy } from "./types";

export async function scheduleLeadEmailJobs(params: {
  category: LeadCategory;
  leadId: string;
  triggeredBy: SequenceTriggeredBy;
  jobs: Array<{
    emailType: BookingEmailType;
    scheduledFor: Date;
    idempotencyKey: string;
  }>;
}): Promise<{ inserted: number }> {
  if (params.category === "client") {
    const client = createLinkTrackingClient();
    const lead = await findLeadById(client, "client", params.leadId);
    if (lead && !isClientResendAutoEmailsEnabled(lead.profile)) {
      return { inserted: 0 };
    }
  }

  let inserted = 0;
  for (const job of params.jobs) {
    const row = await insertJob({
      category: params.category,
      leadId: params.leadId,
      emailType: job.emailType,
      scheduledFor: job.scheduledFor,
      triggeredBy: params.triggeredBy,
      idempotencyKey: job.idempotencyKey,
    });
    if (row) inserted += 1;
  }
  if (inserted > 0) {
    const { dispatchDueBookingEmails } = await import("./orchestrator");
    await dispatchDueBookingEmails(100);
  }
  return { inserted };
}

export async function sendProductEmailNow(params: {
  category: LeadCategory;
  leadId: string;
  emailType: BookingEmailType;
  triggeredBy: SequenceTriggeredBy;
  idempotencyKey: string;
  extra?: {
    surveyLink?: string;
    agenceInfo?: string;
    entrepriseInfo?: string;
    calendlyLink?: string;
    estimatedFirstBookingDate?: string;
    estimatedFirstRdvDate?: string;
    trackingNumber?: string;
    rdvRangeLabel?: string;
    dashboardLink?: string;
    scheduledAt?: string | null;
    reservationAgenceLink?: string;
    reservationCifLink?: string;
    billingPortalLink?: string;
    checkoutTrialLink?: string;
  };
}): Promise<{ ok: boolean; error?: string }> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, params.category, params.leadId);
  if (!lead) {
    return { ok: false, error: "lead_not_found" };
  }

  if (
    params.category === "client" &&
    !isClientResendAutoEmailsEnabled(lead.profile)
  ) {
    return { ok: false, error: "client_resend_auto_disabled" };
  }

  const verticalOverride =
    params.category === "client"
      ? (() => {
          const raw = lead.profile?.client_type;
          return raw === "dec" || raw === "cif" || raw === "ias" ? raw : "dec";
        })()
      : undefined;

  const template = await resolveBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
    verticalOverride,
  });

  const jobVars = await extraVarsForJob(
    {
      email_type: params.emailType,
      lead_id: params.leadId,
      lead_category: params.category,
    },
    lead,
  );

  const rendered = await renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category: params.category,
    emailType: params.emailType,
    firstName: lead.first_name,
    scheduledAt: params.extra?.scheduledAt ?? jobVars.scheduledAt ?? lead.scheduled_at,
    confirmUrl: confirmUrlForLead(lead, params.emailType, params.category),
    useHtml: defaultUseHtml(params.emailType),
    dashboardLink:
      params.extra?.dashboardLink ?? jobVars.dashboardLink ?? dashboardLinkFor(lead) ?? "",
    reservationAgenceLink:
      params.extra?.reservationAgenceLink ??
      jobVars.reservationAgenceLink ??
      reservationAgenceLinkFor(lead),
    company: lead.company,
    email: lead.email,
    surveyLink: params.extra?.surveyLink ?? jobVars.surveyLink,
    agenceInfo: params.extra?.agenceInfo ?? jobVars.agenceInfo,
    entrepriseInfo: params.extra?.entrepriseInfo ?? jobVars.entrepriseInfo,
    calendlyLink: params.extra?.calendlyLink ?? jobVars.calendlyLink,
    estimatedFirstBookingDate:
      params.extra?.estimatedFirstBookingDate ?? jobVars.estimatedFirstBookingDate,
    estimatedFirstRdvDate:
      params.extra?.estimatedFirstRdvDate ?? jobVars.estimatedFirstRdvDate,
    trackingNumber: params.extra?.trackingNumber ?? jobVars.trackingNumber,
    rdvRangeLabel: params.extra?.rdvRangeLabel ?? jobVars.rdvRangeLabel,
    reservationCifLink:
      params.extra?.reservationCifLink ?? jobVars.reservationCifLink,
    billingPortalLink:
      params.extra?.billingPortalLink ?? jobVars.billingPortalLink,
    checkoutTrialLink:
      params.extra?.checkoutTrialLink ?? jobVars.checkoutTrialLink,
  });

  const now = new Date();
  const job = await insertJob({
    category: params.category,
    leadId: params.leadId,
    emailType: params.emailType,
    scheduledFor: now,
    triggeredBy: params.triggeredBy,
    idempotencyKey: params.idempotencyKey,
    useHtml: defaultUseHtml(params.emailType),
  });

  const threaded = await prepareThreadedSend(
    { email_type: params.emailType, lead_id: params.leadId },
    rendered,
  );

  const result = await sendBookingEmail({
    to: lead.email,
    subject: threaded.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: params.idempotencyKey,
    headers: threaded.headers,
  });

  if (!result.ok) {
    if (job) await markJobFailed(job.id, result.error);
    return { ok: false, error: result.error };
  }

  if (job) {
    await markJobSent(job.id, result.id, {
      messageId: result.messageId,
      threadSubject: threaded.threadSubject,
    });
  }

  return { ok: true };
}
