const DEFAULT_MODALITES_BASE = "https://www.hercule.dev/modalites-hercule.html";

export function getModalitesConfirmBaseUrl(): string {
  return (
    process.env.BOOKING_MODALITES_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_MODALITES_BASE
  );
}

export function buildModalitesConfirmUrl(slug: string, email: string): string {
  const trimmedSlug = slug.trim();
  const url = new URL(`${getModalitesConfirmBaseUrl()}/${trimmedSlug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  return url.toString();
}

export function modalitesConfirmUrlFor(lead: {
  slug: string;
  email: string;
}): string {
  return buildModalitesConfirmUrl(lead.slug, lead.email);
}
