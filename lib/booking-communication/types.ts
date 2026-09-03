import type { LeadCategory, LinkTrackingLead } from "@/lib/link-tracking/types";

export type BookingEmailType =
  | "immediate"
  | "h48_confirm"
  | "h24_relance"
  | "h20_cancel";

export type BookingJobStatus = "pending" | "sent" | "cancelled" | "failed";

export type SequenceTriggeredBy = "calendly" | "manual" | "retry";

export type BookingEmailJob = {
  id: string;
  lead_category: LeadCategory;
  lead_id: string;
  email_type: BookingEmailType;
  scheduled_for: string;
  status: BookingJobStatus;
  resend_email_id: string | null;
  idempotency_key: string;
  triggered_by: SequenceTriggeredBy;
  sent_at: string | null;
  cancelled_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type StartSequenceParams = {
  category: LeadCategory;
  lead: LinkTrackingLead;
  triggeredBy: SequenceTriggeredBy;
  /** When set, delays the immediate email until this instant. */
  sequenceStartsAt?: Date;
};

export type RenderedBookingEmail = {
  subject: string;
  text: string;
};
