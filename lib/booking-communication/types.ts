import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

export type BookingEmailType =
  | "immediate"
  | "h48_confirm"
  | "h24_relance"
  | "h20_cancel"
  | "role_seq_48"
  | "role_seq_24";

export type BookingJobStatus = "pending" | "sent" | "cancelled" | "failed";

export type SequenceTriggeredBy =
  | "calendly"
  | "manual"
  | "retry"
  | "role_recovery";

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
