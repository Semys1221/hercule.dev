import type { LeadCategory, LeadStatut } from "@/lib/link-tracking/types";

export const MODALITES_SKIP_REASONS = [
  "too_soon",
  "no_lead",
  "not_booked",
  "confirmed",
  "cancelled",
  "missing_start",
] as const;

export type ModalitesSkipReason = (typeof MODALITES_SKIP_REASONS)[number];

export type ModalitesJobStatus = "pending" | "sent" | "cancelled" | "failed" | null;

export type ModalitesCandidate = {
  leadId: string;
  leadCategory: LeadCategory;
  email: string;
  name: string;
  firstName: string | null;
  company: string | null;
  slug: string;
  confirmUrl: string;
  scheduledAt: string;
  statut: LeadStatut;
  inviteeUri: string;
  eventUri: string;
  askStatus: ModalitesJobStatus;
  cancelStatus: ModalitesJobStatus;
  enforceStatus: ModalitesJobStatus;
  skipReason: null;
};

export type ModalitesSkipped = {
  email: string;
  name: string;
  scheduledAt: string | null;
  leadId: string | null;
  leadCategory: LeadCategory | null;
  statut: LeadStatut | null;
  reason: ModalitesSkipReason;
};

export type ModalitesPreview = {
  subject: string;
  text: string;
  html?: string;
  confirmUrl: string;
};
