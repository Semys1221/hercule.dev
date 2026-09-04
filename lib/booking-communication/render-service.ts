import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

import { defaultUseHtml } from "./signatures";
import { sendBookingEmail } from "./send";
import {
  confirmUrlForLead,
  getBookingEmailTemplates,
  renderCustomBookingEmail,
  renderEmailFromStore,
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
  const confirmUrl = confirmUrlForLead(resolvedLead, emailType);
  const useHtml = params.useHtml ?? defaultUseHtml(emailType);

  if (params.subject?.trim() && params.body?.trim()) {
    return renderCustomBookingEmail({
      subject: params.subject.trim(),
      body: params.body,
      emailType,
      firstName: resolvedLead.first_name,
      scheduledAt: resolvedLead.scheduled_at,
      confirmUrl,
      useHtml,
    });
  }

  if (params.subject?.trim() || params.body) {
    const templates = await getBookingEmailTemplates(params.category);
    const template = templates.find((row) => row.email_type === emailType);
    if (!template) {
      throw new Error(`missing_template:${emailType}`);
    }
    return renderCustomBookingEmail({
      subject: params.subject?.trim() || template.subject,
      body: params.body ?? template.body,
      emailType,
      firstName: resolvedLead.first_name,
      scheduledAt: resolvedLead.scheduled_at,
      confirmUrl,
      useHtml,
    });
  }

  return renderEmailFromStore({
    category: params.category,
    emailType,
    firstName: resolvedLead.first_name,
    scheduledAt: resolvedLead.scheduled_at,
    confirmUrl,
    useHtml,
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
  const confirmUrl = confirmUrlForLead(lead, emailType);
  const useHtml = params.useHtml ?? defaultUseHtml(emailType);
  const rendered =
    params.subject?.trim() && params.body?.trim()
      ? await renderCustomBookingEmail({
          subject: params.subject.trim(),
          body: params.body,
          emailType,
          firstName: lead.first_name,
          scheduledAt: lead.scheduled_at,
          confirmUrl,
          useHtml,
        })
      : await renderEmailFromStore({
          category: params.category,
          emailType,
          firstName: lead.first_name,
          scheduledAt: lead.scheduled_at,
          confirmUrl,
          useHtml,
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
