import type { BookingEmailType } from "./types";

const THREAD_EMAIL_ORDER = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
] as const;

export type ThreadEmailType = (typeof THREAD_EMAIL_ORDER)[number];

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
  return emailType !== "immediate" && emailType !== "role_seq_48";
}

export function threadTypesForJob(emailType: BookingEmailType): BookingEmailType[] {
  if (emailType === "role_seq_24") {
    return ["role_seq_48"];
  }
  return [
    "immediate",
    "h48_confirm",
    "h24_relance",
    "h20_cancel",
  ];
}

export function threadEmailOrder(): readonly ThreadEmailType[] {
  return THREAD_EMAIL_ORDER;
}
