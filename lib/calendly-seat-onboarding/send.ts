import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";

import { defaultUseHtml } from "@/lib/booking-communication/signatures";
import { insertJob, markJobFailed, markJobSent } from "@/lib/booking-communication/jobs";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import {
  confirmUrlForLead,
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "@/lib/booking-communication/template-store";
import type { BookingEmailType, SequenceTriggeredBy } from "@/lib/booking-communication/types";

import type { CalendlySeatProductEmailType } from "./types";

export async function sendCalendlySeatEmail(params: {
  agenceId: string;
  emailType: CalendlySeatProductEmailType;
  triggeredBy: SequenceTriggeredBy;
  idempotencyKey: string;
  dryRun?: boolean;
}): Promise<{ ok: true; resendEmailId: string | null; subject: string }> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, "agence", params.agenceId);
  if (!lead) {
    throw new Error("lead_not_found");
  }

  const emailType = params.emailType as BookingEmailType;
  const template = await resolveBookingEmailTemplate({
    category: "agence",
    emailType,
  });

  const rendered = await renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category: "agence",
    emailType,
    firstName: lead.first_name,
    scheduledAt: lead.scheduled_at,
    confirmUrl: confirmUrlForLead(lead, emailType, "agence"),
    useHtml: defaultUseHtml(emailType),
    dashboardLink: lead.dashboard_link || dashboardLinkFor(lead) || undefined,
    company: lead.company,
    email: lead.email,
  });

  if (params.dryRun) {
    return { ok: true, resendEmailId: null, subject: rendered.subject };
  }

  const now = new Date();
  const job = await insertJob({
    category: "agence",
    leadId: lead.id,
    emailType,
    scheduledFor: now,
    triggeredBy: params.triggeredBy,
    idempotencyKey: params.idempotencyKey,
  });

  const result = await sendBookingEmail({
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey: params.idempotencyKey,
  });

  if (!result.ok) {
    if (job) {
      await markJobFailed(job.id, result.error);
    }
    throw new Error(result.error);
  }

  if (job) {
    await markJobSent(job.id, result.id, {
      messageId: result.messageId,
      threadSubject: rendered.subject.trim() || null,
    });
  }

  return {
    ok: true,
    resendEmailId: result.id,
    subject: rendered.subject,
  };
}

export function calendlySeatLeadSummary(lead: LinkTrackingLead): {
  agenceId: string;
  email: string;
} {
  return {
    agenceId: lead.id,
    email: lead.email,
  };
}
