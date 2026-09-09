import type { BookingEmailType } from "./types";

/** Meeting confirmation Resend sequences and auto-cancel are permanently disabled. */
export const BOOKING_CONFIRMATION_DISABLED = true;

export const DISABLED_MEETING_CONFIRMATION_TYPES: readonly BookingEmailType[] = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
  "modalites_ask",
  "modalites_cancel",
  "modalites_enforce_cancel",
];

const DISABLED_TYPE_SET = new Set<string>(DISABLED_MEETING_CONFIRMATION_TYPES);

export function isDisabledMeetingConfirmationType(
  emailType: BookingEmailType,
): boolean {
  return DISABLED_TYPE_SET.has(emailType);
}

export function bookingConfirmationDisabledResponse(): { error: string } {
  return { error: "booking_confirmation_disabled" };
}
