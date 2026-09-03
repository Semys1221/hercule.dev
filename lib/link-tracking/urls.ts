import type { LeadCategory } from "./types";

const DEFAULT_TRACKING_BASE_AGENCE =
  "https://www.hercule.dev/reservation.html";
const DEFAULT_TRACKING_BASE_ENTREPRISE =
  "https://www.hercule.dev/reservation-entreprise.html";

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

export function buildTrackingUrl(slug: string, category: LeadCategory): string {
  return `${getTrackingBaseUrl(category)}/${slug}`;
}
