import { buildReplySubject, buildThreadHeaders } from "@/lib/booking-communication/threading";

export const NOT_PRESENT_SUBJECT = "Votre rendez-vous avec Hercule";

export type NotPresentResendMail = {
  subject: string;
  headers?: Record<string, string>;
};

export function resolveNotPresentResendMail(thread: {
  threadSubject: string | null;
  messageIds: string[];
}): NotPresentResendMail {
  const hasThread =
    Boolean(thread.threadSubject?.trim()) && thread.messageIds.length > 0;

  if (!hasThread) {
    return { subject: NOT_PRESENT_SUBJECT };
  }

  return {
    subject: buildReplySubject(thread.threadSubject!),
    headers: buildThreadHeaders(thread.messageIds),
  };
}
