import { formatFrenchDate } from "@/lib/retraction/dates";
import { dashboardLinkFor, reservationAgenceLinkFor, reservationCifLinkFor } from "@/lib/link-tracking/urls";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { createLinkTrackingClient, findLeadById } from "@/lib/link-tracking/supabase";
import { isConferenceInviteEmailType } from "@/lib/cif-conference-sequence/orchestrator";

import { findMatchForLeadEmailType } from "@/lib/matching/store";
import {
  acquisitionRdvRangeLabel,
  trackingNumberForSlug,
} from "@/lib/comptable-acquisition-sequence/dates";

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
  estimatedFirstRdvDate?: string;
  trackingNumber?: string;
  rdvRangeLabel?: string;
  activationDate?: string;
  retractionEndsAt?: string;
  scheduledAt?: string | null;
  reservationCifLink?: string;
  /** proposition_ludovic_* only */
  profileVolume?: string;
  offerLabel?: string;
  amountLabel?: string;
}> {
  const dashboardLink = dashboardLinkFor(lead) ?? "";
  const reservationAgenceLink = reservationAgenceLinkFor(lead);
  const retractionEndsRaw = lead.retraction_ends_at;
  const retractionEndsAt =
    retractionEndsRaw && !Number.isNaN(new Date(retractionEndsRaw).getTime())
      ? formatFrenchDate(new Date(retractionEndsRaw))
      : "";
  const activationDate = retractionEndsAt || estimatedFirstBookingDateFromLead(lead);

  const estimatedFromLead = estimatedFirstBookingDateFromLead(lead);
  const slug = lead.slug?.trim() ?? "";
  const acquisitionExtras =
    (job.email_type as BookingEmailType).startsWith("comptable_acquisition_")
      ? {
          trackingNumber: trackingNumberForSlug(slug),
          estimatedFirstRdvDate: estimatedFromLead,
          rdvRangeLabel: acquisitionRdvRangeLabel(),
        }
      : {};

  // Extras for proposition_ludovic_* emails — read persisted data from lead.profile
  const propositionLudovicExtras = (job.email_type as BookingEmailType).startsWith(
    "proposition_ludovic_",
  )
    ? (() => {
        const profile = (lead.profile ?? {}) as Record<string, unknown>;
        const payment = (profile.proposition_payment ?? {}) as Record<string, unknown>;
        return {
          trackingNumber: trackingNumberForSlug(slug),
          estimatedFirstRdvDate: estimatedFromLead,
          profileVolume: String(payment.profileVolume ?? ""),
          offerLabel: String(payment.offerLabel ?? ""),
          amountLabel: String(payment.amountLabel ?? ""),
        };
      })()
    : {};

  const base = {
    dashboardLink,
    reservationAgenceLink,
    company: lead.company,
    email: lead.email,
    estimatedFirstBookingDate: estimatedFromLead,
    estimatedFirstRdvDate:
      propositionLudovicExtras.estimatedFirstRdvDate ??
      acquisitionExtras.estimatedFirstRdvDate ??
      estimatedFromLead,
    trackingNumber:
      propositionLudovicExtras.trackingNumber ?? acquisitionExtras.trackingNumber ?? "",
    rdvRangeLabel: acquisitionExtras.rdvRangeLabel ?? "",
    activationDate,
    retractionEndsAt,
    profileVolume: propositionLudovicExtras.profileVolume ?? "",
    offerLabel: propositionLudovicExtras.offerLabel ?? "",
    amountLabel: propositionLudovicExtras.amountLabel ?? "",
  };

  const emailType = job.email_type as BookingEmailType;

  if (isConferenceInviteEmailType(emailType) && job.lead_category === "cif") {
    return {
      ...base,
      reservationCifLink: reservationCifLinkFor(lead),
    };
  }

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
