const DEFAULT_MODALITES_BASE = "https://www.hercule.dev/modalites-hercule.html";

export function getModalitesConfirmBaseUrl(): string {
  return (
    process.env.BOOKING_MODALITES_BASE_URL?.trim().replace(/\/$/, "") ??
    DEFAULT_MODALITES_BASE
  );
}

export function buildModalitesConfirmUrl(
  slug: string,
  email: string,
  options?: { autoConfirm?: boolean },
): string {
  const trimmedSlug = slug.trim();
  const url = new URL(`${getModalitesConfirmBaseUrl()}/${trimmedSlug}`);
  if (email.trim()) {
    url.searchParams.set("email", email.trim().toLowerCase());
  }
  if (options?.autoConfirm) {
    url.searchParams.set("confirm", "1");
  }
  return url.toString();
}

export function modalitesConfirmUrlFor(
  lead: {
    slug: string;
    email: string;
  },
  options?: { autoConfirm?: boolean },
): string {
  return buildModalitesConfirmUrl(lead.slug, lead.email, options);
}
