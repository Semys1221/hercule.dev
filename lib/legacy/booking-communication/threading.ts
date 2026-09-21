import {
  isSequenceFollowUp,
  threadTypesForJob as patternThreadTypesForJob,
} from "./sequence-pattern";
import type { BookingEmailType } from "./types";

export function buildReplySubject(threadSubject: string): string {
  const trimmed = threadSubject.trim();
  if (!trimmed) return "Re:";
  return trimmed.startsWith("Re:") ? trimmed : `Re: ${trimmed}`;
}

export function buildThreadHeaders(messageIds: string[]): Record<string, string> {
  const ids = messageIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return {};
  }
  const last = ids[ids.length - 1]!;
  return {
    "In-Reply-To": last,
    References: ids.join(" "),
  };
}

export function isThreadFollowUp(emailType: string): boolean {
  return isSequenceFollowUp(emailType as BookingEmailType);
}

export function threadTypesForJob(emailType: BookingEmailType): BookingEmailType[] {
  return patternThreadTypesForJob(emailType);
}
