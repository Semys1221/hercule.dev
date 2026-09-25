import { findClientById } from "@/lib/clients/supabase";
import {
  findVerticalByRouteSegment,
  loadClientBookingConfig,
} from "@/lib/clients/booking-config/load";
import type { ComptableDeliveryRouteSegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import { routeSegmentForComptableDeliverySegment } from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import {
  buildCalendlySchedulingUrl,
  buildReservationSurfaceFromLookup,
  readComptableDeliverySegmentFromLead,
  type ReservationSurfaceResult,
} from "@/lib/legacy/booking/reservation-surface";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/legacy/link-tracking/supabase";

const DEFAULT_CLIENT_KEY = "pierremeniaud";

export function routeSegmentMatchesLead(
  routeSegment: ComptableDeliveryRouteSegment,
  leadSegment: string | null,
): boolean {
  const expected = routeSegmentForComptableDeliverySegment(leadSegment);
  return expected === routeSegment;
}

export async function resolveComptableDeliveryReservation(
  routeSegment: ComptableDeliveryRouteSegment,
  slug: string,
  clientKey = DEFAULT_CLIENT_KEY,
): Promise<ReservationSurfaceResult | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  const config = loadClientBookingConfig(clientKey);
  const verticalConfig = findVerticalByRouteSegment(config, routeSegment);
  if (!verticalConfig) return null;

  const client = createLinkTrackingClient();
  const lookup = await findLeadByLink(client, trimmed);
  if (!lookup || lookup.category !== "comptable_delivery") {
    return null;
  }

  const leadSegment = readComptableDeliverySegmentFromLead(lookup.lead);
  if (!routeSegmentMatchesLead(routeSegment, leadSegment)) {
    return null;
  }

  const clientId = lookup.lead.client_id?.trim() || config.clientId;
  const assigned = clientId ? await findClientById(client, clientId) : null;

  const surface = buildReservationSurfaceFromLookup(lookup, assigned);
  const calendlyBase = verticalConfig.calendlySchedulingUrl.trim();

  return {
    ...surface,
    comptableDeliveryRouteSegment: routeSegment,
    calendlyUrl: buildCalendlySchedulingUrl(calendlyBase, {
      email: surface.email,
      slug: surface.slug,
    }),
  };
}
