import { getScheduledEventInvitee, parseEventAndInviteeUuids } from "@/lib/calendly";
import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";
import {
  createLinkTrackingClient,
  findLeadById,
  persistCalendlyMeetingLinks,
} from "@/lib/link-tracking/supabase";
import { provisionRoleRecoveryLead } from "@/lib/link-tracking/provision-role-recovery-lead";
import type { LeadLookup, LeadStatut, LinkTrackingLead } from "@/lib/link-tracking/types";
import {
  createSalesCallsClient,
  findSalesCallStatusesByInviteeUris,
} from "@/lib/sales-calls/supabase";
import type { SalesCallStatus } from "@/lib/sales-calls/types";
import {
  buildDashboardUrl,
  buildLeadUrls,
  confirmationAgenceLinkFor,
  dashboardLinkFor,
  reservationAgenceLinkFor,
} from "@/lib/link-tracking/urls";

export type BookingDisplayLinks = {
  reservation_agence_link: string | null;
  confirmation_agence_link: string | null;
  dashboard_link: string | null;
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
};

export type EnrichedCalendlyBooking = CalendlyBookingRow & {
  statut: LeadStatut | null;
  sales_call_status: SalesCallStatus | null;
  links: BookingDisplayLinks;
  lead_matched: boolean;
  provisioned: boolean;
  warning: string | null;
};

type MeetingLinks = Pick<
  BookingDisplayLinks,
  "calendly_join_url" | "calendly_reschedule_url" | "calendly_cancel_url"
>;

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function mergeMeetingLinks(
  booking: Pick<
    CalendlyBookingRow,
    "calendly_join_url" | "calendly_reschedule_url" | "calendly_cancel_url"
  >,
  lead: LinkTrackingLead | null,
): MeetingLinks {
  return {
    calendly_join_url:
      trimOrNull(booking.calendly_join_url) ??
      trimOrNull(lead?.calendly_join_url) ??
      null,
    calendly_reschedule_url:
      trimOrNull(booking.calendly_reschedule_url) ??
      trimOrNull(lead?.calendly_reschedule_url) ??
      null,
    calendly_cancel_url:
      trimOrNull(booking.calendly_cancel_url) ??
      trimOrNull(lead?.calendly_cancel_url) ??
      null,
  };
}

export function buildCrmLinks(
  lead: LinkTrackingLead | null,
  slug: string | null,
  email: string,
): Pick<
  BookingDisplayLinks,
  "reservation_agence_link" | "confirmation_agence_link" | "dashboard_link"
> {
  if (lead) {
    const reservation = reservationAgenceLinkFor(lead);
    return {
      reservation_agence_link: reservation || null,
      confirmation_agence_link: confirmationAgenceLinkFor(lead),
      dashboard_link: dashboardLinkFor(lead),
    };
  }

  const resolvedSlug = slug?.trim();
  if (!resolvedSlug) {
    return {
      reservation_agence_link: null,
      confirmation_agence_link: null,
      dashboard_link: null,
    };
  }

  const urls = buildLeadUrls(resolvedSlug, email);
  return {
    reservation_agence_link: urls.reservation_agence_link,
    confirmation_agence_link: urls.confirmation_agence_link,
    dashboard_link: buildDashboardUrl(resolvedSlug),
  };
}

export function buildDisplayLinks(
  booking: CalendlyBookingRow,
  lead: LinkTrackingLead | null,
): BookingDisplayLinks {
  const meeting = mergeMeetingLinks(booking, lead);
  const crm = buildCrmLinks(lead, booking.slug ?? lead?.slug ?? null, booking.email);

  return { ...crm, ...meeting };
}

function needsMeetingLinkPersist(
  lead: LinkTrackingLead,
  links: MeetingLinks,
): boolean {
  if (!links.calendly_cancel_url || !links.calendly_reschedule_url) {
    return false;
  }
  return (
    lead.calendly_cancel_url !== links.calendly_cancel_url ||
    lead.calendly_reschedule_url !== links.calendly_reschedule_url ||
    Boolean(
      links.calendly_join_url && lead.calendly_join_url !== links.calendly_join_url,
    )
  );
}

async function fetchMeetingLinksFallback(
  inviteeUri: string,
  current: MeetingLinks,
): Promise<MeetingLinks> {
  if (current.calendly_cancel_url && current.calendly_reschedule_url) {
    return current;
  }

  const uuids = parseEventAndInviteeUuids(inviteeUri);
  if (!uuids) {
    return current;
  }

  try {
    const fetched = await getScheduledEventInvitee(uuids.eventUuid, uuids.inviteeUuid);
    return {
      calendly_join_url: current.calendly_join_url ?? fetched.joinUrl,
      calendly_reschedule_url: current.calendly_reschedule_url ?? fetched.rescheduleUrl,
      calendly_cancel_url: current.calendly_cancel_url ?? fetched.cancelUrl,
    };
  } catch {
    return current;
  }
}

async function persistMeetingLinksIfNeeded(
  lookup: LeadLookup,
  booking: CalendlyBookingRow,
  links: MeetingLinks,
): Promise<LinkTrackingLead> {
  if (!needsMeetingLinkPersist(lookup.lead, links)) {
    return lookup.lead;
  }

  try {
    const client = createLinkTrackingClient();
    return await persistCalendlyMeetingLinks(client, lookup, {
      joinUrl: links.calendly_join_url,
      rescheduleUrl: links.calendly_reschedule_url,
      cancelUrl: links.calendly_cancel_url,
      calendlyInviteeUri: booking.invitee_uri,
      scheduledAt: booking.start_time,
      synced: Boolean(links.calendly_cancel_url && links.calendly_reschedule_url),
      syncError:
        links.calendly_cancel_url && links.calendly_reschedule_url
          ? null
          : "missing_cancel_or_reschedule",
    });
  } catch (err) {
    console.warn(
      "[enrich-bookings] persist meeting links failed:",
      err instanceof Error ? err.message : err,
    );
    return lookup.lead;
  }
}

async function enrichSingleBooking(
  booking: CalendlyBookingRow,
): Promise<EnrichedCalendlyBooking> {
  const client = createLinkTrackingClient();
  let lookup: LeadLookup | null = null;
  let provisioned = false;
  let warning: string | null = null;
  let provisionResolvedSlug: string | null = booking.slug?.trim() || null;

  if (booking.lead_id && booking.lead_category) {
    const lead = await findLeadById(client, booking.lead_category, booking.lead_id);
    if (lead) {
      lookup = { category: booking.lead_category, lead };
    }
  }

  if (!lookup && booking.booking_category === "agence") {
    const result = await provisionRoleRecoveryLead({
      email: booking.email,
      firstName: booking.first_name,
      company: booking.company,
      scheduledAt: booking.start_time,
      calendlyInviteeUri: booking.invitee_uri,
      calendlyPayload: {
        invitee_uri: booking.invitee_uri,
        event_uri: booking.event_uri,
      },
      calendlyQuestions: booking.questions,
      slug: booking.slug,
    });

    if (result.ok) {
      lookup = result.lookup;
      provisioned = result.created;
      provisionResolvedSlug = result.resolvedSlug;
    } else if (result.reason === "entreprise_email_collision") {
      warning = "Email existant en entreprise — liens CRM non provisionnés.";
    } else if (result.reason === "insert_failed") {
      provisionResolvedSlug = result.resolvedSlug;
      console.error(
        "[enrich-bookings] provision failed for",
        booking.email,
        result.errorMessage ?? "unknown",
      );
      warning = "CRM non enregistré — liens affichés à titre indicatif.";
    }
  }

  const resolvedSlug =
    lookup?.lead.slug?.trim() || provisionResolvedSlug || null;

  let meetingLinks = mergeMeetingLinks(booking, lookup?.lead ?? null);
  meetingLinks = await fetchMeetingLinksFallback(booking.invitee_uri, meetingLinks);

  let lead = lookup?.lead ?? null;
  if (lookup) {
    lead = await persistMeetingLinksIfNeeded(lookup, booking, meetingLinks);
    lookup = { category: lookup.category, lead };
  }

  const links: BookingDisplayLinks = {
    ...buildCrmLinks(lead, resolvedSlug, booking.email),
    ...meetingLinks,
  };

  return {
    ...booking,
    slug: resolvedSlug,
    lead_id: lead?.id ?? booking.lead_id,
    lead_category: lookup?.category ?? booking.lead_category,
    statut: lead?.statut ?? null,
    sales_call_status: null,
    links,
    lead_matched: Boolean(lead),
    provisioned,
    warning,
  };
}

async function attachSalesCallStatuses(
  bookings: EnrichedCalendlyBooking[],
): Promise<EnrichedCalendlyBooking[]> {
  try {
    const client = createSalesCallsClient();
    const statuses = await findSalesCallStatusesByInviteeUris(
      client,
      bookings.map((booking) => booking.invitee_uri),
    );
    return bookings.map((booking) => ({
      ...booking,
      sales_call_status: statuses.get(booking.invitee_uri) ?? null,
    }));
  } catch (err) {
    console.warn(
      "[enrich-bookings] sales_calls status lookup failed:",
      err instanceof Error ? err.message : err,
    );
    return bookings;
  }
}

export async function enrichBookingsForAdmin(
  bookings: CalendlyBookingRow[],
): Promise<EnrichedCalendlyBooking[]> {
  const enriched: EnrichedCalendlyBooking[] = [];
  for (const booking of bookings) {
    enriched.push(await enrichSingleBooking(booking));
  }
  return attachSalesCallStatuses(enriched);
}
