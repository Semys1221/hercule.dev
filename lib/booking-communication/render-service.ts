import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

import { defaultUseHtml } from "./signatures";
import { meetingActionLinksForRender } from "./meeting-links";
import { sendBookingEmail } from "./send";
import {
  confirmUrlForLead,
  renderCustomBookingEmail,
  resolveBookingEmailTemplate,
} from "./template-store";
import { insertJob, markJobFailed, markJobSent } from "./jobs";
import type { BookingEmailType, RenderedBookingEmail } from "./types";

const SAMPLE_CONFIRM_URL =
  "https://www.hercule.dev/confirm-reservation.html/exemple-slug?email=jean@example.com";

export type RenderBookingEmailParams = {
  category: LeadCategory;
  emailType?: BookingEmailType;
  subject?: string;
  body?: string;
  leadId?: string;
  useHtml?: boolean;
  sample?: boolean;
};

async function loadLeadOrSample(
  category: LeadCategory,
  leadId?: string,
  sample?: boolean,
): Promise<{ lead: LinkTrackingLead | null; sample: boolean }> {
  if (leadId && !sample) {
    const client = createLinkTrackingClient();
    const lead = await findLeadById(client, category, leadId);
    if (!lead) {
      throw new Error("lead_not_found");
    }
    return { lead, sample: false };
  }
  return { lead: null, sample: true };
}

function sampleLead(_category: LeadCategory): LinkTrackingLead {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-0000-0000-000000000000",
    email: "jean@example.com",
    slug: "exemple-slug",
    first_name: "Jean",
    company: "Exemple SARL",
    statut: "MEETING_BOOKED",
    scheduled_at: "2026-09-10T09:00:00+02:00",
    reservation_agence_link: "",
    reservation_entreprise_link: "",
    confirmation_agence_link: SAMPLE_CONFIRM_URL,
    instantly_lead_id: null,
    instantly_campaign_id: null,
    calendly_invitee_uri: null,
    calendly_join_url: null,
    calendly_reschedule_url: null,
    calendly_cancel_url: null,
    calendly_links_synced_at: null,
    calendly_links_sync_error: null,
    booked_at: null,
    instantly_synced_at: null,
    calendly_payload: null,
    calendly_questions: null,
    confirmed_at: null,
    instantly_confirmed_synced_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function renderBookingEmailPreview(
  params: RenderBookingEmailParams,
): Promise<RenderedBookingEmail> {
  const emailType = params.emailType ?? "h48_confirm";
  const { lead, sample } = await loadLeadOrSample(
    params.category,
    params.leadId,
    params.sample,
  );
  const resolvedLead = lead ?? sampleLead(params.category);
  const confirmUrl = confirmUrlForLead(resolvedLead, emailType, params.category);
  const useHtml = params.useHtml ?? defaultUseHtml(emailType);
  const meetingActionLinks = await meetingActionLinksForRender(
    emailType,
    lead,
    sample,
    params.category,
  );

  const template = await resolveBookingEmailTemplate({
    category: params.category,
    emailType,
    subject: params.subject,
    body: params.body,
  });

  return renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category: params.category,
    emailType,
    firstName: resolvedLead.first_name,
    scheduledAt: resolvedLead.scheduled_at,
    confirmUrl,
    useHtml,
    meetingActionLinks,
  });
}

export async function sendBookingEmailOnce(params: {
  category: LeadCategory;
  leadId: string;
  emailType: BookingEmailType;
  subject?: string;
  body?: string;
  useHtml?: boolean;
}): Promise<{ ok: true; resendEmailId: string; subject: string }> {
  const client = createLinkTrackingClient();
  const lead = await findLeadById(client, params.category, params.leadId);
  if (!lead) {
    throw new Error("lead_not_found");
  }

  const emailType = params.emailType;
  const confirmUrl = confirmUrlForLead(lead, emailType, params.category);
  const useHtml = params.useHtml ?? defaultUseHtml(emailType);
  const meetingActionLinks = await meetingActionLinksForRender(
    emailType,
    lead,
    false,
    params.category,
  );

  const template =
    params.subject?.trim() && params.body?.trim()
      ? { subject: params.subject.trim(), body: params.body }
      : await resolveBookingEmailTemplate({
          category: params.category,
          emailType,
          subject: params.subject,
          body: params.body,
        });

  const rendered = await renderCustomBookingEmail({
    subject: template.subject,
    body: template.body,
    category: params.category,
    emailType,
    firstName: lead.first_name,
    scheduledAt: lead.scheduled_at,
    confirmUrl,
    useHtml,
    meetingActionLinks,
  });

  const now = new Date();
  const idempotencyKey = `legacy:${lead.id}:${emailType}:${now.getTime()}`;
  const job = await insertJob({
    category: params.category,
    leadId: lead.id,
    emailType,
    scheduledFor: now,
    triggeredBy: "manual",
    idempotencyKey,
    useHtml,
  });

  const result = await sendBookingEmail({
    to: lead.email,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey,
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
