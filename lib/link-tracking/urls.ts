import type { LeadCategory, LinkTrackingLead } from "./types";

const DEFAULT_TRACKING_BASE_AGENCE =
  "https://www.hercule.dev/reservation.html";
const DEFAULT_TRACKING_BASE_ENTREPRISE =
  "https://www.hercule.dev/reservation-entreprise.html";
const DEFAULT_TRACKING_BASE_COMPTABLE =
  "https://www.hercule.dev/reservation-entreprise.html";
const DEFAULT_TRACKING_BASE_CIF =
  "https://www.hercule.dev/reservation-cif.html";
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

export type CifLeadUrls = {
  reservation_cif_link: string;
  confirmation_cif_link: string;
  dashboard_link: string;
};

export type InstantlyCanonicalVariables = LeadUrls & {
  statut: string;
  link: string;
  confirm_link: string;
  tracking_url: string;
  post_booking_link?: string;
  reservation_cif_link?: string;
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
  if (category === "cif") {
    return (
      process.env.TRACKING_BASE_URL_CIF?.trim().replace(/\/$/, "") ??
      DEFAULT_TRACKING_BASE_CIF
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

export function buildCifLeadUrls(slug: string, email: string): CifLeadUrls {
  return {
    reservation_cif_link: buildTrackingUrl(slug, "cif"),
    confirmation_cif_link: buildConfirmationComptableLink(slug, email),
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

export function extractDashboardSlug(dashboardLink: string | null | undefined): string | null {
  const trimmed = dashboardLink?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, "https://example.com");
    const parts = url.pathname.split("/").filter(Boolean);
    const dashboardIndex = parts.indexOf("dashboard");
    if (dashboardIndex === -1 || dashboardIndex >= parts.length - 1) {
      return null;
    }
    return decodeURIComponent(parts[dashboardIndex + 1] ?? "");
  } catch {
    return null;
  }
}

export function resolveSalesSessionDashboardLink(params: {
  lead: Pick<LinkTrackingLead, "slug" | "dashboard_link"> | null;
  bookingDashboardLink?: string | null;
  developerMode?: boolean;
  origin?: string;
}): { link: string | null; isFake: boolean } {
  const leadLink = params.lead ? dashboardLinkFor(params.lead) : null;
  const slug =
    params.lead?.slug?.trim() ||
    extractDashboardSlug(params.bookingDashboardLink) ||
    extractDashboardSlug(leadLink);

  if (slug) {
    if (params.developerMode && params.origin) {
      return {
        link: `${params.origin.replace(/\/$/, "")}/dashboard/${encodeURIComponent(slug)}`,
        isFake: false,
      };
    }

    return {
      link: leadLink ?? params.bookingDashboardLink ?? buildDashboardUrl(slug),
      isFake: false,
    };
  }

  if (params.developerMode) {
    return { link: buildDashboardUrl("dev-preview"), isFake: true };
  }

  return { link: null, isFake: false };
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

export function reservationCifLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "reservation_cif_link">,
): string {
  const stored = lead.reservation_cif_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return "";
  return buildTrackingUrl(slug, "cif");
}

export function confirmationCifLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "confirmation_cif_link">,
): string {
  const stored = lead.confirmation_cif_link?.trim();
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
  if (category === "cif") {
    const cifUrls = buildCifLeadUrls(slug, email);
    return {
      reservation_agence_link: "",
      reservation_entreprise_link: cifUrls.reservation_cif_link,
      confirmation_agence_link: cifUrls.confirmation_cif_link,
      statut,
      link: "",
      confirm_link: "",
      tracking_url: "",
      reservation_cif_link: cifUrls.reservation_cif_link,
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
