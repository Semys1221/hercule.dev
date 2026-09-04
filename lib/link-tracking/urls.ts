import type { LeadCategory, LinkTrackingLead } from "./types";

const DEFAULT_TRACKING_BASE_AGENCE =
  "https://www.hercule.dev/reservation.html";
const DEFAULT_TRACKING_BASE_ENTREPRISE =
  "https://www.hercule.dev/reservation-entreprise.html";
const DEFAULT_CONFIRM_BASE =
  "https://www.hercule.dev/confirm-reservation.html";

export type LeadUrls = {
  reservation_agence_link: string;
  reservation_entreprise_link: string;
  confirmation_agence_link: string;
};

export type InstantlyCanonicalVariables = LeadUrls & {
  statut: string;
  link: string;
  confirm_link: string;
  tracking_url: string;
};

export function getTrackingBaseUrl(category: LeadCategory): string {
  if (category === "agence") {
    return (
      process.env.TRACKING_BASE_URL_AGENCE?.trim().replace(/\/$/, "") ??
      process.env.TRACKING_BASE_URL?.trim().replace(/\/$/, "") ??
      DEFAULT_TRACKING_BASE_AGENCE
    );
  }
  return (
    process.env.TRACKING_BASE_URL_ENTREPRISE?.trim().replace(/\/$/, "") ??
    DEFAULT_TRACKING_BASE_ENTREPRISE
  );
}

export function getConfirmBaseUrl(): string {
  return (
    process.env.BOOKING_CONFIRM_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_CONFIRM_BASE
  );
}

export function buildTrackingUrl(slug: string, category: LeadCategory): string {
  return `${getTrackingBaseUrl(category)}/${slug}`;
}

export function buildConfirmationAgenceLink(slug: string, email: string): string {
  const url = new URL(`${getConfirmBaseUrl()}/${slug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  return url.toString();
}

export function buildLeadUrls(slug: string, email: string): LeadUrls {
  return {
    reservation_agence_link: buildTrackingUrl(slug, "agence"),
    reservation_entreprise_link: buildTrackingUrl(slug, "entreprise"),
    confirmation_agence_link: buildConfirmationAgenceLink(slug, email),
  };
}

export function leadSlug(lead: Pick<LinkTrackingLead, "slug">): string {
  return lead.slug?.trim() ?? "";
}

export function confirmationAgenceLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "confirmation_agence_link">,
): string {
  const stored = lead.confirmation_agence_link?.trim();
  if (stored) return stored;
  return buildConfirmationAgenceLink(lead.slug, lead.email);
}

export function buildInstantlyCustomVariables(
  slug: string,
  email: string,
  statut: string,
): InstantlyCanonicalVariables {
  return {
    ...buildLeadUrls(slug, email),
    statut,
    link: "",
    confirm_link: "",
    tracking_url: "",
  };
}
