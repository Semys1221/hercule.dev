import type { LeadCategory, LinkTrackingLead } from "./types";

const DEFAULT_TRACKING_BASE_AGENCE =
  "https://www.hercule.dev/reservation.html";
const DEFAULT_TRACKING_BASE_ENTREPRISE =
  "https://www.hercule.dev/reservation-entreprise.html";
const DEFAULT_TRACKING_BASE_COMPTABLE =
  "https://www.hercule.dev/reservation-entreprise.html";
const DEFAULT_CONFIRM_BASE =
  "https://www.hercule.dev/confirm-reservation.html";
const DEFAULT_DASHBOARD_BASE = "https://www.hercule.dev/dashboard";
const DEFAULT_ENTREPRISE_POST_BASE =
  "https://www.hercule.dev/post-booking-entreprise.html";

export type LeadUrls = {
  reservation_agence_link: string;
  reservation_entreprise_link: string;
  confirmation_agence_link: string;
};

export type EntrepriseLeadUrls = LeadUrls & {
  post_booking_link: string;
};

export type ComptableLeadUrls = {
  reservation_comptable_link: string;
  confirmation_comptable_link: string;
  dashboard_link: string;
};

export type InstantlyCanonicalVariables = LeadUrls & {
  statut: string;
  link: string;
  confirm_link: string;
  tracking_url: string;
  post_booking_link?: string;
};

export function getTrackingBaseUrl(category: LeadCategory): string {
  if (category === "agence") {
    return (
      process.env.TRACKING_BASE_URL_AGENCE?.trim().replace(/\/$/, "") ??
      process.env.TRACKING_BASE_URL?.trim().replace(/\/$/, "") ??
      DEFAULT_TRACKING_BASE_AGENCE
    );
  }
  if (category === "comptable") {
    return (
      process.env.TRACKING_BASE_URL_COMPTABLE?.trim().replace(/\/$/, "") ??
      DEFAULT_TRACKING_BASE_COMPTABLE
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

export function getDashboardBaseUrl(): string {
  return (
    process.env.DASHBOARD_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_DASHBOARD_BASE
  );
}

export function getEntreprisePostBookingBaseUrl(): string {
  return (
    process.env.BOOKING_ENTREPRISE_POST_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_ENTREPRISE_POST_BASE
  );
}

export {
  buildModalitesConfirmUrl,
  getModalitesConfirmBaseUrl,
  modalitesConfirmUrlFor,
} from "@/lib/modalites-campaign/urls";

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

export function buildEntreprisePostBookingUrl(slug: string, email: string): string {
  const url = new URL(`${getEntreprisePostBookingBaseUrl()}/${slug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  return url.toString();
}

export function buildDashboardUrl(slug: string): string {
  return `${getDashboardBaseUrl()}/${slug}`;
}

export function buildLeadUrls(slug: string, email: string): LeadUrls {
  return {
    reservation_agence_link: buildTrackingUrl(slug, "agence"),
    reservation_entreprise_link: buildTrackingUrl(slug, "entreprise"),
    confirmation_agence_link: buildConfirmationAgenceLink(slug, email),
  };
}

export function buildEntrepriseLeadUrls(
  slug: string,
  email: string,
): EntrepriseLeadUrls {
  return {
    ...buildLeadUrls(slug, email),
    post_booking_link: buildEntreprisePostBookingUrl(slug, email),
  };
}

export function buildConfirmationComptableLink(slug: string, email: string): string {
  const url = new URL(`${getConfirmBaseUrl()}/${slug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  return url.toString();
}

export function buildComptableLeadUrls(
  slug: string,
  email: string,
): ComptableLeadUrls {
  return {
    reservation_comptable_link: buildTrackingUrl(slug, "comptable"),
    confirmation_comptable_link: buildConfirmationComptableLink(slug, email),
    dashboard_link: buildDashboardUrl(slug),
  };
}

export function dashboardLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "dashboard_link">,
): string | null {
  const stored = lead.dashboard_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return null;
  return buildDashboardUrl(slug);
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

export function reservationAgenceLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "reservation_agence_link">,
): string {
  const stored = lead.reservation_agence_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return "";
  return buildTrackingUrl(slug, "agence");
}

export function reservationEntrepriseLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "reservation_entreprise_link">,
): string {
  const stored = lead.reservation_entreprise_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return "";
  return buildTrackingUrl(slug, "entreprise");
}

export function postBookingLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "post_booking_link">,
): string | null {
  const stored = lead.post_booking_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return null;
  return buildEntreprisePostBookingUrl(slug, lead.email);
}

export function reservationComptableLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "reservation_comptable_link">,
): string {
  const stored = lead.reservation_comptable_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return "";
  return buildTrackingUrl(slug, "comptable");
}

export function confirmationComptableLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "confirmation_comptable_link">,
): string {
  const stored = lead.confirmation_comptable_link?.trim();
  if (stored) return stored;
  return buildConfirmationComptableLink(lead.slug, lead.email);
}

export function buildInstantlyCustomVariables(
  slug: string,
  email: string,
  statut: string,
  category: LeadCategory = "entreprise",
): InstantlyCanonicalVariables {
  if (category === "comptable") {
    const comptableUrls = buildComptableLeadUrls(slug, email);
    return {
      reservation_agence_link: "",
      reservation_entreprise_link: comptableUrls.reservation_comptable_link,
      confirmation_agence_link: comptableUrls.confirmation_comptable_link,
      statut,
      link: "",
      confirm_link: "",
      tracking_url: "",
    };
  }
  const urls =
    category === "entreprise"
      ? buildEntrepriseLeadUrls(slug, email)
      : buildLeadUrls(slug, email);
  return {
    ...urls,
    statut,
    link: "",
    confirm_link: "",
    tracking_url: "",
  };
}
