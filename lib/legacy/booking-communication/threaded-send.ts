import { getThreadContext } from "./jobs";
import {
  buildReplySubject,
  buildThreadHeaders,
  isThreadFollowUp,
  threadTypesForJob,
} from "./threading";
import type { BookingEmailJob, RenderedBookingEmail } from "./types";

export type ThreadedSendPayload = {
  subject: string;
  headers?: Record<string, string>;
  threadSubject: string | null;
};

export async function prepareThreadedSend(
  job: Pick<BookingEmailJob, "email_type" | "lead_id">,
  rendered: Pick<RenderedBookingEmail, "subject">,
): Promise<ThreadedSendPayload> {
  if (!isThreadFollowUp(job.email_type)) {
    return {
      subject: rendered.subject,
      threadSubject: rendered.subject.trim() || null,
    };
  }

  const thread = await getThreadContext(
    job.lead_id,
    threadTypesForJob(job.email_type),
  );
  if (!thread.threadSubject || thread.messageIds.length === 0) {
    console.warn(
      `[booking-communication] Missing thread context for ${job.email_type} lead ${job.lead_id}`,
    );
    return { subject: rendered.subject, threadSubject: null };
  }

  return {
    subject: buildReplySubject(thread.threadSubject),
    headers: buildThreadHeaders(thread.messageIds),
    threadSubject: null,
  };
}
