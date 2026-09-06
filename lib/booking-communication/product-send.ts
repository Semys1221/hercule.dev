import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";
import type { LeadCategory } from "@/lib/link-tracking/types";

import { insertJob, markJobFailed, markJobSent } from "./jobs";
import { sendBookingEmail } from "./send";
import { defaultUseHtml } from "./signatures";
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
    dashboardLink?: string;
    scheduledAt?: string | null;
  };
}): Promise<{ ok: boolean; error?: string }> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, params.category, params.leadId);
  if (!lead) {
    return { ok: false, error: "lead_not_found" };
  }

  const template = await resolveBookingEmailTemplate({
    category: params.category,
    emailType: params.emailType,
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
    company: lead.company,
    email: lead.email,
    surveyLink: params.extra?.surveyLink ?? jobVars.surveyLink,
    agenceInfo: params.extra?.agenceInfo ?? jobVars.agenceInfo,
    entrepriseInfo: params.extra?.entrepriseInfo ?? jobVars.entrepriseInfo,
    calendlyLink: params.extra?.calendlyLink ?? jobVars.calendlyLink,
    estimatedFirstBookingDate:
      params.extra?.estimatedFirstBookingDate ?? jobVars.estimatedFirstBookingDate,
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

  const result = await sendBookingEmail({
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: params.idempotencyKey,
  });

  if (!result.ok) {
    if (job) await markJobFailed(job.id, result.error);
    return { ok: false, error: result.error };
  }

  if (job) {
    await markJobSent(job.id, result.id, {
      messageId: result.messageId,
      threadSubject: rendered.subject.trim() || null,
    });
  }

  return { ok: true };
}
