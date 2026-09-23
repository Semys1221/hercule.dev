import { renderBookingEmailPreview } from "@/lib/legacy/booking-communication/render-service";
import { insertJob, markJobFailed, markJobSent } from "@/lib/legacy/booking-communication/jobs";
import { defaultUseHtml } from "@/lib/legacy/booking-communication/signatures";
import { sendBookingEmail } from "@/lib/legacy/booking-communication/send";
import { prepareThreadedSend } from "@/lib/legacy/booking-communication/threaded-send";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

import { resolveTestLeadForCategory } from "./resolve-test-lead";

export async function sendSequenceTestEmail(params: {
  category: LeadCategory;
  emailType: BookingEmailType;
  recipientEmail: string;
  subject?: string;
  body?: string;
  from?: string;
}): Promise<{ ok: true; resendEmailId: string; jobId: string | null; subject: string }> {
  const recipient = params.recipientEmail.trim().toLowerCase();
  if (!recipient) {
    throw new Error("recipient_email_required");
  }

  const lead = await resolveTestLeadForCategory(params.category);

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
    from: params.from,
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
