import { renderBookingEmailPreview } from "@/lib/booking-communication/render-service";
import { insertJob, markJobFailed, markJobSent } from "@/lib/booking-communication/jobs";
import { defaultUseHtml } from "@/lib/booking-communication/signatures";
import { sendBookingEmail } from "@/lib/booking-communication/send";
import { prepareThreadedSend } from "@/lib/booking-communication/threaded-send";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import type { LeadCategory } from "@/lib/link-tracking/types";

function testLeadIdForCategory(category: LeadCategory): string | null {
  if (category === "agence") {
    return process.env.SEQUENCE_TEST_LEAD_ID_AGENCE?.trim() || null;
  }
  return null;
}

export async function sendSequenceTestEmail(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  recipientEmail: string;
  subject?: string;
  body?: string;
}): Promise<{ ok: true; resendEmailId: string; jobId: string | null; subject: string }> {
  const recipient = params.recipientEmail.trim().toLowerCase();
  if (!recipient) {
    throw new Error("recipient_email_required");
  }

  const leadId = testLeadIdForCategory(params.category);
  const client = createLinkTrackingClient();
  const lead = leadId ? await findLeadById(client, params.category, leadId) : null;

  const rendered = await renderBookingEmailPreview({
    category: params.category,
    emailType: params.emailType,
    subject: params.subject,
    body: params.body,
    leadId: lead?.id,
    sample: !lead,
    useHtml: defaultUseHtml(params.emailType),
  });

  const now = new Date();
  const idempotencyKey = `sequence-test:${params.category}:${params.emailType}:${recipient}:${now.getTime()}`;
  const useHtml = defaultUseHtml(params.emailType);

  const job = lead
    ? await insertJob({
        category: params.category,
        leadId: lead.id,
        emailType: params.emailType,
        scheduledFor: now,
        triggeredBy: "manual",
        idempotencyKey,
        useHtml,
      })
    : null;

  const threaded = await prepareThreadedSend(
    { email_type: params.emailType, lead_id: lead?.id ?? "00000000-0000-0000-0000-000000000000" },
    rendered,
  );

  const result = await sendBookingEmail({
    to: recipient,
    subject: threaded.subject,
    text: rendered.text,
    html: rendered.html,
    idempotencyKey,
    headers: threaded.headers,
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
      threadSubject: threaded.threadSubject,
    });
  }

  return {
    ok: true,
    resendEmailId: result.id,
    jobId: job?.id ?? null,
    subject: rendered.subject,
  };
}
