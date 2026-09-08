import type { BookingEmailType } from "./types";

export {
  formatParisSlot,
  isWithinSendWindow,
  nextSendSlot,
} from "@/lib/instantly-bypass/send-window";

const SEND_WINDOW_BYPASS_TYPES: BookingEmailType[] = [
  "immediate",
  "upsell_email_1",
  "close_indecis_1",
  "no_show_indecis_1",
  "onboarding_j0",
  "match_proposal",
  "match_booking_agence",
  "survey_rdv_entreprise",
  "survey_rdv_agence",
  "payment_notification_client",
  "deliverance_search_started",
  "deliverance_milestone",
  "deliverance_waitlist",
  "product_calendly_welcome",
  "product_payment_welcome",
  "role_seq_48",
  "role_seq_24",
  "modalites_ask",
  "modalites_cancel",
  "modalites_enforce_cancel",
];

/** Mail 1 sends immediately, even outside the Paris weekday send window. */
export function bypassesSendWindow(emailType: BookingEmailType): boolean {
  return SEND_WINDOW_BYPASS_TYPES.includes(emailType);
}
