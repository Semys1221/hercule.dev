import { findClientById } from "@/lib/clients/supabase";
import {
  calendlyUrlForComptableDeliverySegment,
  defaultComptableDeliveryVertical,
  resolveComptableDeliveryVerticalByCampaignId,
} from "@/lib/legacy/admin/niches/comptable-delivery-verticals";
import {
  createLinkTrackingClient,
  findLeadByLink,
} from "@/lib/legacy/link-tracking/supabase";
import {
  CIF_CONFERENCE_CALENDLY_URL,
  CONFERENCE_COHORT_SESSION,
} from "@/lib/legacy/cif-conference-sequence/constants";
import type { LeadCategory, LeadLookup, LinkTrackingLead } from "@/lib/legacy/link-tracking/types";

export const RESERVATION_SURFACES = [
  "agence",
  "entreprise",
  "conference",
  "comptable_delivery",
] as const;

export type ReservationSurface = (typeof RESERVATION_SURFACES)[number];
export type ReservationTheme = "hercule-dark" | "jum-light";
export type ConferenceNiche = "comptable" | "cif";

export const CALENDLY_EVENT_URLS = {
  agence: "https://calendly.com/hercule-connect/30min",
  entreprise:
    "https://calendly.com/hercule-connect/candidature-web-apport-d-affaires-clone",
  conference: CIF_CONFERENCE_CALENDLY_URL,
} as const;

export const EVAN_PORTRAIT_URL =
  "https://grzs6rqzvzupoxv9.public.blob.vercel-storage.com/image%20last-optimized.webp";

export const JUM_PORTRAIT_URL =
  "https://grzs6rqzvzupoxv9.public.blob.vercel-storage.com/jum-portrait.webp";

export type ConferenceCopy = {
  pageTitle: string;
  confirmedTitle: string;
  confirmationHeading: string;
  bullets: string[];
  contextText: string;
  dateShort: string;
  dateFull: string;
};

export type ReservationSurfaceResult = {
  category: LeadCategory;
  slug: string;
  email: string;
  surface: ReservationSurface;
  theme: ReservationTheme;
  calendlyUrl: string;
  conferenceNiche: ConferenceNiche | null;
  jumSegment: string | null;
  comptableDeliveryRouteSegment?:
    | "restaurant"
    | "btp"
    | "chirurgien-dentiste"
    | null;
  copy: {
    pageTitle: string;
    confirmedTitle: string;
  };
};

export function surfaceForCategory(category: LeadCategory): ReservationSurface {
  if (category === "comptable" || category === "cif") {
    return "conference";
  }
  if (category === "comptable_delivery") {
    return "comptable_delivery";
  }
  return "conference";
}

export function themeForSurface(surface: ReservationSurface): ReservationTheme {
  return surface === "comptable_delivery" ? "jum-light" : "hercule-dark";
}

export function conferenceCopy(niche: ConferenceNiche): ConferenceCopy {
  const dateShort = `Ce ${CONFERENCE_COHORT_SESSION.labelFr} · ${CONFERENCE_COHORT_SESSION.hourParis}`;
  const dateFull = `${CONFERENCE_COHORT_SESSION.labelFr} à ${CONFERENCE_COHORT_SESSION.hourParis}`;
  const shared = {
    confirmedTitle: "Inscription confirmée · Conférence Hercule",
    dateShort,
    dateFull,
    contextText:
      "Vous recevrez le lien de connexion par email via Calendly. Merci de vous connecter quelques minutes avant l'heure — la conférence démarre à 10h pile, heure de Paris.",
  };

  if (niche === "comptable") {
    return {
      ...shared,
      pageTitle: "Conférence Hercule · Expertise comptable",
      confirmationHeading: "Conférence Hercule — méthode & déploiement comptable",
      bullets: [
        "Présentation de la méthode Hercule : capture brandée, qualification et routage exclusif des flux TPE (BNC, BIC, TNS).",
        "Temps d'échanges sur votre zone, votre capacité et la compatibilité avec nos demandes de tenue, fiscal et social.",
      ],
    };
  }

  return {
    ...shared,
    pageTitle: "Conférence Hercule · Conseil en gestion de patrimoine",
    confirmationHeading: "Conférence Hercule — méthode & déploiement CIF",
    bullets: [
      "Présentation de la méthode Hercule : capture brandée, qualification et routage exclusif des flux patrimoniaux.",
      "Temps d'échanges sur votre zone, votre capacité et la compatibilité avec nos demandes d'optimisation fiscale et de trésorerie.",
    ],
  };
}

export function buildCalendlySchedulingUrl(
  base: string,
  options: { email?: string | null; slug?: string | null },
): string {
  const url = new URL(base);
  const email = options.email?.trim();
  const slug = options.slug?.trim();
  if (email) {
    url.searchParams.set("email", email);
  }
  if (slug) {
    url.searchParams.set("utm_content", slug);
  }
  return url.toString();
}

export function readComptableDeliverySegmentFromLead(
  lead: Pick<LinkTrackingLead, "profile" | "instantly_campaign_id">,
): string | null {
  const profile = lead.profile;
  if (profile) {
    for (const key of [
      "comptable_delivery_segment",
      "jum_segment",
      "segment",
    ] as const) {
      const value = profile[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim().toLowerCase();
      }
    }
  }
  if (lead.instantly_campaign_id?.trim()) {
    const vertical = resolveComptableDeliveryVerticalByCampaignId(
      lead.instantly_campaign_id,
    );
    if (vertical) return vertical.segment;
  }
  return null;
}

/** @deprecated */
export function readJumSegmentFromLead(
  lead: Pick<LinkTrackingLead, "profile" | "instantly_campaign_id">,
): string | null {
  return readComptableDeliverySegmentFromLead(lead);
}

export function comptableDeliveryCalendlyUrlFromLead(
  lead: Pick<LinkTrackingLead, "profile" | "instantly_campaign_id">,
): string {
  const segment = readComptableDeliverySegmentFromLead(lead);
  if (segment) {
    return calendlyUrlForComptableDeliverySegment(segment);
  }
  if (lead.instantly_campaign_id?.trim()) {
    const vertical = resolveComptableDeliveryVerticalByCampaignId(
      lead.instantly_campaign_id,
    );
    if (vertical) return vertical.calendlySchedulingUrl;
  }
  return defaultComptableDeliveryVertical().calendlySchedulingUrl;
}

/** @deprecated */
export function jumCalendlyUrlFromLead(
  lead: Pick<LinkTrackingLead, "profile" | "instantly_campaign_id">,
): string {
  return comptableDeliveryCalendlyUrlFromLead(lead);
}

export function pageCopyForSurface(params: {
  surface: ReservationSurface;
  conferenceNiche: ConferenceNiche | null;
}): { pageTitle: string; confirmedTitle: string } {
  if (params.surface === "conference") {
    const copy = conferenceCopy(params.conferenceNiche ?? "cif");
    return {
      pageTitle: copy.pageTitle,
      confirmedTitle: copy.confirmedTitle,
    };
  }
  if (params.surface === "comptable_delivery") {
    return {
      pageTitle: "Réserver un créneau · Expert-comptable",
      confirmedTitle: "Rendez-vous confirmé",
    };
  }
  if (params.surface === "agence") {
    return {
      pageTitle: "Réserver un échange · Hercule",
      confirmedTitle: "Rendez-vous confirmé · Hercule",
    };
  }
  return {
    pageTitle: "Planifier votre échange · Hercule",
    confirmedTitle: "Rendez-vous confirmé · Hercule",
  };
}

export function calendlyBaseUrlForLookup(
  lookup: LeadLookup,
  assignedClient?: { calendly_scheduling_url?: string | null } | null,
): string {
  const assigned = assignedClient?.calendly_scheduling_url?.trim();
  if (lookup.lead.client_id?.trim() && assigned) {
    return assigned;
  }
  const surface = surfaceForCategory(lookup.category);
  if (surface === "comptable_delivery") {
    return comptableDeliveryCalendlyUrlFromLead(lookup.lead);
  }
  if (surface === "conference") {
    return CALENDLY_EVENT_URLS.conference;
  }
  if (surface === "agence") {
    return CALENDLY_EVENT_URLS.agence;
  }
  return CALENDLY_EVENT_URLS.entreprise;
}

export function buildReservationSurfaceFromLookup(
  lookup: LeadLookup,
  assignedClient?: { calendly_scheduling_url?: string | null } | null,
): ReservationSurfaceResult {
  const surface = surfaceForCategory(lookup.category);
  const conferenceNiche: ConferenceNiche | null =
    lookup.category === "comptable" || lookup.category === "cif"
      ? lookup.category
      : null;
  const jumSegment =
    surface === "comptable_delivery"
      ? readComptableDeliverySegmentFromLead(lookup.lead)
      : null;
  const copy = pageCopyForSurface({ surface, conferenceNiche });

  return {
    category: lookup.category,
    slug: lookup.lead.slug,
    email: lookup.lead.email,
    surface,
    theme: themeForSurface(surface),
    calendlyUrl: calendlyBaseUrlForLookup(lookup, assignedClient),
    conferenceNiche,
    jumSegment,
    copy,
  };
}

export async function resolveReservationSurface(
  slug: string,
): Promise<ReservationSurfaceResult | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const client = createLinkTrackingClient();
  const lookup = await findLeadByLink(client, trimmed);
  if (!lookup) return null;
  const clientId = lookup.lead.client_id?.trim();
  const assigned = clientId ? await findClientById(client, clientId) : null;
  return buildReservationSurfaceFromLookup(lookup, assigned);
}

