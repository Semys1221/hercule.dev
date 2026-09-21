import type { LeadCategory, LinkTrackingLead } from "./types";

const DEFAULT_TRACKING_BASE = "https://www.hercule.dev/reservation";
const DEFAULT_CONFIRM_BASE =
  "https://www.hercule.dev/confirm-reservation.html";
const DEFAULT_CONFIRM_BASE_JUM =
  "https://www.hercule.dev/confirm-reservation-jum.html";
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
  dashboard_link: string;
};

export type JumLeadUrls = {
  reservation_jum_link: string;
  confirmation_jum_link: string;
  dashboard_link: string;
};

export type InstantlyCanonicalVariables = LeadUrls & {
  statut: string;
  link: string;
  confirm_link: string;
  tracking_url: string;
  post_booking_link?: string;
  reservation_cif_link?: string;
  reservation_jum_link?: string;
};

export function getTrackingBaseUrl(category: LeadCategory): string {
  const byCategory =
    category === "agence"
      ? process.env.TRACKING_BASE_URL_AGENCE
      : category === "comptable"
        ? process.env.TRACKING_BASE_URL_COMPTABLE
        : category === "cif"
          ? process.env.TRACKING_BASE_URL_CIF
          : category === "jum"
            ? process.env.TRACKING_BASE_URL_JUM
            : category === "client"
              ? process.env.TRACKING_BASE_URL_CLIENT
              : process.env.TRACKING_BASE_URL_ENTREPRISE;
  return (
    byCategory?.trim().replace(/\/$/, "") ??
    process.env.TRACKING_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_TRACKING_BASE
  );
}

export function isCanonicalReservationUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    const pathname = new URL(trimmed, "https://www.hercule.dev").pathname;
    return /^\/reservation\/[^/]+\/?$/.test(pathname);
  } catch {
    return false;
  }
}

export function getConfirmBaseUrl(category?: LeadCategory): string {
  if (category === "jum") {
    return (
      process.env.BOOKING_CONFIRM_BASE_URL_JUM?.trim().replace(/\/$/, "") ??
      DEFAULT_CONFIRM_BASE_JUM
    );
  }
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
} from "@/lib/legacy/modalites-campaign/urls";

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
    dashboard_link: buildDashboardUrl(slug),
  };
}

export function buildConfirmationJumLink(slug: string, email: string): string {
  const url = new URL(`${getConfirmBaseUrl("jum")}/${slug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  return url.toString();
}

export function buildJumLeadUrls(slug: string, email: string): JumLeadUrls {
  return {
    reservation_jum_link: buildTrackingUrl(slug, "jum"),
    confirmation_jum_link: buildConfirmationJumLink(slug, email),
    dashboard_link: buildDashboardUrl(slug),
  };
}

export function dashboardLinkFor(
  lead: Pick<
    LinkTrackingLead,
    | "slug"
    | "dashboard_link"
    | "reservation_agence_link"
    | "reservation_entreprise_link"
    | "reservation_comptable_link"
    | "reservation_cif_link"
    | "reservation_jum_link"
    | "confirmation_agence_link"
    | "confirmation_jum_link"
    | "post_booking_link"
  >,
): string | null {
  const stored = lead.dashboard_link?.trim();
  if (stored) return stored;
  const slug = resolveLeadSlug(lead);
  if (!slug) return null;
  if (lead.dashboard_link?.includes("/clients/")) {
    return lead.dashboard_link;
  }
  return buildDashboardUrl(slug);
}

export function extractTrackingSlug(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const pathname = new URL(trimmed, "https://example.com").pathname;
    const parts = pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (!last || last.endsWith(".html")) {
      return null;
    }
    return decodeURIComponent(last);
  } catch {
    return null;
  }
}

export function resolveLeadSlug(
  lead: Pick<
    LinkTrackingLead,
    | "slug"
    | "dashboard_link"
    | "reservation_agence_link"
    | "reservation_entreprise_link"
    | "reservation_comptable_link"
    | "reservation_cif_link"
    | "reservation_jum_link"
    | "confirmation_agence_link"
    | "confirmation_comptable_link"
    | "confirmation_jum_link"
    | "post_booking_link"
  >,
): string | null {
  const direct = lead.slug?.trim();
  if (direct) {
    return direct;
  }

  const candidates = [
    lead.dashboard_link,
    lead.reservation_entreprise_link,
    lead.reservation_agence_link,
    lead.reservation_comptable_link,
    lead.reservation_cif_link,
    lead.reservation_jum_link,
    lead.confirmation_agence_link,
    lead.confirmation_comptable_link,
    lead.confirmation_jum_link,
    lead.post_booking_link,
  ];

  for (const candidate of candidates) {
    const fromDashboard = extractDashboardSlug(candidate);
    if (fromDashboard) {
      return fromDashboard;
    }
    const fromTracking = extractTrackingSlug(candidate);
    if (fromTracking) {
      return fromTracking;
    }
  }

  return null;
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
  lead: Pick<
    LinkTrackingLead,
    | "slug"
    | "dashboard_link"
    | "reservation_agence_link"
    | "reservation_entreprise_link"
    | "reservation_comptable_link"
    | "reservation_cif_link"
    | "confirmation_agence_link"
    | "confirmation_comptable_link"
    | "post_booking_link"
  > | null;
  bookingDashboardLink?: string | null;
  bookingSlug?: string | null;
  developerMode?: boolean;
  origin?: string;
}): { link: string | null; isFake: boolean } {
  const leadLink = params.lead ? dashboardLinkFor(params.lead) : null;
  const slug =
    params.lead?.slug?.trim() ||
    params.bookingSlug?.trim() ||
    (params.lead ? resolveLeadSlug(params.lead) : null) ||
    extractDashboardSlug(params.bookingDashboardLink) ||
    extractDashboardSlug(leadLink) ||
    extractTrackingSlug(params.bookingDashboardLink);

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
  _lead: Pick<LinkTrackingLead, "slug" | "email">,
): string {
  return "";
}

export function reservationJumLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "reservation_jum_link">,
): string {
  const stored = lead.reservation_jum_link?.trim();
  if (stored) return stored;
  const slug = lead.slug?.trim();
  if (!slug) return "";
  return buildTrackingUrl(slug, "jum");
}

export function confirmationJumLinkFor(
  lead: Pick<LinkTrackingLead, "slug" | "email" | "confirmation_jum_link">,
): string {
  const stored = lead.confirmation_jum_link?.trim();
  if (stored) return stored;
  return buildConfirmationJumLink(lead.slug, lead.email);
}

export function buildInstantlyCustomVariables(
  slug: string,
  email: string,
  statut: string,
  category: LeadCategory = "entreprise",
  options?: { jumSegment?: string | null },
): InstantlyCanonicalVariables & { jum_segment?: string; reservation_jum_link?: string } {
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
      confirmation_agence_link: "",
      statut,
      link: "",
      confirm_link: "",
      tracking_url: "",
      reservation_cif_link: cifUrls.reservation_cif_link,
    };
  }
  if (category === "jum") {
    const jumUrls = buildJumLeadUrls(slug, email);
    const segment = options?.jumSegment?.trim();
    return {
      reservation_agence_link: "",
      reservation_entreprise_link: jumUrls.reservation_jum_link,
      confirmation_agence_link: jumUrls.confirmation_jum_link,
      statut,
      link: "",
      confirm_link: jumUrls.confirmation_jum_link,
      tracking_url: "",
      reservation_jum_link: jumUrls.reservation_jum_link,
      ...(segment ? { jum_segment: segment } : {}),
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
