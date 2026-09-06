import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

export const BOOKING_EMAIL_TYPE_VALUES = [
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
  "product_calendly_welcome",
  "product_calendly_reminder",
  "product_payment_welcome",
  "upsell_email_1",
  "upsell_email_2",
  "upsell_email_3",
  "close_indecis_1",
  "close_indecis_2",
  "close_indecis_3",
  "no_show_indecis_1",
  "no_show_indecis_2",
  "no_show_indecis_3",
  "onboarding_j0",
  "onboarding_j0_bis",
  "onboarding_j1",
  "onboarding_reminder_m10",
  "onboarding_reminder_m5",
  "onboarding_reminder_p5",
  "deliverance_search_started",
  "deliverance_d7_update",
  "deliverance_milestone",
  "deliverance_waitlist",
  "match_proposal",
  "match_proposal_followup",
  "match_booking_agence",
  "survey_rdv_entreprise",
  "survey_rdv_entreprise_followup",
  "survey_rdv_agence",
  "survey_rdv_agence_followup",
  "sold_check_j7",
  "payment_notification_client",
] as const;

export type BookingEmailType = (typeof BOOKING_EMAIL_TYPE_VALUES)[number];

export type BookingJobStatus = "pending" | "sent" | "cancelled" | "failed";

export const SEQUENCE_TRIGGERED_BY_VALUES = [
  "calendly",
  "manual",
  "retry",
  "role_recovery",
  "stripe_payment",
  "calendly_seat_cron",
  "onboarding_complete",
  "sales_call_completed",
  "sales_call_not_paid",
  "sales_call_no_show",
  "onboarding_sequence",
  "admin_match",
  "calendly_match_booking",
  "cron_rdv_survey",
  "cron_sold_check",
  "stripe_payment_notification",
  "deliverance_admin",
] as const;

export type SequenceTriggeredBy = (typeof SEQUENCE_TRIGGERED_BY_VALUES)[number];

export type BookingEmailJob = {
  id: string;
  lead_category: LeadCategory;
  lead_id: string;
  email_type: BookingEmailType;
  scheduled_for: string;
  status: BookingJobStatus;
  resend_email_id: string | null;
  resend_message_id: string | null;
  thread_subject: string | null;
  use_html: boolean | null;
  idempotency_key: string;
  triggered_by: SequenceTriggeredBy;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type BookingEmailEngagementEvent = "opened" | "clicked" | "delivered";

export type StartSequenceParams = {
  category: LeadCategory;
  lead: LinkTrackingLead;
  triggeredBy: SequenceTriggeredBy;
  /** When set, delays the immediate email until this instant. */
  sequenceStartsAt?: Date;
  /** When set, only schedule these email types (validated per category). */
  emailTypes?: BookingEmailType[];
  /** Skip hasSequenceStarted guard — rely on per-job idempotency. */
  partial?: boolean;
  /** Per-type HTML override; null on job = defaultUseHtml(email_type). */
  htmlByType?: Partial<Record<BookingEmailType, boolean>>;
  /** Override role recovery send times (weekday routing or rebalance). */
  recoverySchedule?: {
    roleSeq48: Date;
    roleSeq24: Date;
  };
};

export type RenderedBookingEmail = {
  subject: string;
  text: string;
  html?: string;
};
