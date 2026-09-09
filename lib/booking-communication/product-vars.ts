import { formatFrenchDate } from "@/lib/retraction/dates";
import { dashboardLinkFor, reservationAgenceLinkFor } from "@/lib/link-tracking/urls";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";

import { findMatchForLeadEmailType } from "@/lib/matching/store";
import { formatMeetingDateTime } from "./templates";
import type { BookingEmailJob, BookingEmailType } from "./types";

const SURVEY_BASE = "https://www.hercule.dev/survey";

export function surveyUrlForToken(token: string | null | undefined): string {
  if (!token?.trim()) return "";
  return `${process.env.SURVEY_BASE_URL?.trim().replace(/\/$/, "") || SURVEY_BASE}/${token.trim()}`;
}

export function formatLeadInfo(lead: {
  company: string | null;
  first_name: string | null;
  email: string;
} | null): string {
  if (!lead) return "";
  const name = [lead.first_name, lead.company].filter(Boolean).join(" — ");
  return [name || lead.email, lead.email].filter(Boolean).join("\n");
}

export function estimatedFirstBookingDateFromLead(lead: LinkTrackingLead): string {
  const profile = (lead.profile ?? {}) as Record<string, unknown>;
  const dashboard = (profile.dashboard ?? {}) as Record<string, unknown>;
  const raw =
    (typeof dashboard.estimated_first_booking_at === "string"
      ? dashboard.estimated_first_booking_at
      : null) ??
    (typeof profile.estimated_first_booking_at === "string"
      ? profile.estimated_first_booking_at
      : null);
  if (!raw) return "";
  return formatMeetingDateTime(raw).date;
}

export async function extraVarsForJob(
  job: Pick<BookingEmailJob, "email_type" | "lead_id" | "lead_category">,
  lead: LinkTrackingLead,
): Promise<{
  dashboardLink?: string;
  reservationAgenceLink?: string;
  company?: string | null;
  email?: string;
  surveyLink?: string;
  agenceInfo?: string;
  entrepriseInfo?: string;
  calendlyLink?: string;
  estimatedFirstBookingDate?: string;
  activationDate?: string;
  retractionEndsAt?: string;
  scheduledAt?: string | null;
}> {
  const dashboardLink = dashboardLinkFor(lead) ?? "";
  const reservationAgenceLink = reservationAgenceLinkFor(lead);
  const retractionEndsRaw = lead.retraction_ends_at;
  const retractionEndsAt =
    retractionEndsRaw && !Number.isNaN(new Date(retractionEndsRaw).getTime())
      ? formatFrenchDate(new Date(retractionEndsRaw))
      : "";
  const activationDate = retractionEndsAt || estimatedFirstBookingDateFromLead(lead);

  const base = {
    dashboardLink,
    reservationAgenceLink,
    company: lead.company,
    email: lead.email,
    estimatedFirstBookingDate: estimatedFirstBookingDateFromLead(lead),
    activationDate,
    retractionEndsAt,
  };

  const emailType = job.email_type as BookingEmailType;
  const needsMatch =
    emailType.startsWith("match_") ||
    emailType.startsWith("survey_") ||
    emailType.startsWith("deliverance_") ||
    emailType === "sold_check_j7";

  if (!needsMatch) {
    return base;
  }

  const match = await findMatchForLeadEmailType(job.lead_category, job.lead_id, emailType);
  if (!match) {
    return base;
  }

  const client = createLinkTrackingClient();
  const agence = await findLeadById(client, "agence", match.agence_id);
  const entreprise = await findLeadById(client, "entreprise", match.entreprise_id);

  const surveyToken =
    job.lead_category === "agence"
      ? match.agence_survey_token
      : match.entreprise_survey_token;

  return {
    ...base,
    surveyLink: surveyUrlForToken(surveyToken),
    agenceInfo: formatLeadInfo(agence),
    entrepriseInfo: formatLeadInfo(entreprise),
    calendlyLink: match.calendly_url ?? "",
    scheduledAt: match.booking_at,
  };
}
