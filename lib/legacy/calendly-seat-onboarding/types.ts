export type CalendlySeatOnboardingStatus =
  | "awaiting_invite"
  | "invite_pending"
  | "active"
  | "reminder_sent";

export type CalendlySeatOnboardingRow = {
  id: string;
  agence_id: string;
  email: string;
  status: CalendlySeatOnboardingStatus;
  started_at: string;
  welcome_sent_at: string | null;
  reminder_sent_at: string | null;
  last_checked_at: string | null;
  calendly_invitation_status: "pending" | "accepted" | "declined" | null;
  created_at: string;
  updated_at: string;
};

export const CALENDLY_SEAT_REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

export const CALENDLY_SEAT_PRODUCT_EMAIL_TYPES = [
  "product_calendly_welcome",
  "product_calendly_reminder",
] as const;

export type CalendlySeatProductEmailType =
  (typeof CALENDLY_SEAT_PRODUCT_EMAIL_TYPES)[number];
