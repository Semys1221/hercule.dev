const HERCULE_WEBSITE_URL = "https://hercule.dev";
export const BEATRICE_SIGNATURE = "Béatrice Meyer";

const RESERVATION_PATH_RE = /reservation(?:-entreprise)?\.html/i;
const URL_RE =
  /https?:\/\/[^\s<>]+|(?:www\.)?hercule\.dev[/\w\-.?=&%]*/gi;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePlainText(text: string): string {
  return (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function hasReservationUrl(text: string): boolean {
  return RESERVATION_PATH_RE.test(text);
}

function isReservationUrl(url: string): boolean {
  return RESERVATION_PATH_RE.test(url);
}

function isHerculeSiteUrl(url: string): boolean {
  return url.toLowerCase().includes("hercule.dev") && !isReservationUrl(url);
}

function normalizeUrl(url: string): string {
  const cleaned = url.trim().replace(/[.,;)]+$/, "");
  if (cleaned.toLowerCase().startsWith("www.")) {
    return `https://${cleaned}`;
  }
  if (
    cleaned.toLowerCase().includes("hercule.dev") &&
    !cleaned.toLowerCase().startsWith("http")
  ) {
    return `https://${cleaned.replace(/^\/+/, "")}`;
  }
  return cleaned;
}

function signatureIndex(text: string): number {
  for (const marker of [BEATRICE_SIGNATURE, "Beatrice Meyer"]) {
    const idx = text.lastIndexOf(marker);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

export function ensureBeatriceSignature(text: string): string {
  let body = text;
  if (signatureIndex(body) < 0) {
    body = `${body.replace(/\s+$/, "")}\n\n${BEATRICE_SIGNATURE}`;
  }

  const idx = signatureIndex(body);
  const afterSignature = body.slice(idx).toLowerCase();
  if (!afterSignature.includes("hercule.dev")) {
    body = `${body.replace(/\s+$/, "")}\n${HERCULE_WEBSITE_URL}`;
  }
  return body;
}

export function ensureCtaPresent(text: string, ctaLink: string): string {
  const link = ctaLink.trim();
  if (!link || text.includes(link) || hasReservationUrl(text)) {
    return text;
  }
  return `${text.replace(/\s+$/, "")}\n\nRéservez un créneau ici : ${link}`;
}

function anchorForUrl(url: string): string {
  const normalized = normalizeUrl(url);
  const escapedHref = escapeHtml(normalized);
  if (isReservationUrl(url)) {
    return `<a href="${escapedHref}">Réserver</a>`;
  }
  if (isHerculeSiteUrl(url) || url.toLowerCase().includes("hercule.dev")) {
    return `<a href="${escapedHref}">hercule.dev</a>`;
  }
  return `<a href="${escapedHref}">${escapeHtml(url)}</a>`;
}

function plainToLinkedHtml(plain: string): string {
  const parts: string[] = [];
  let last = 0;
  const urlPattern = new RegExp(URL_RE.source, URL_RE.flags);
  let match = urlPattern.exec(plain);
  while (match) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start > last) {
      parts.push(escapeHtml(plain.slice(last, start)));
    }
    parts.push(anchorForUrl(match[0]));
    last = end;
    match = urlPattern.exec(plain);
  }
  if (last < plain.length) {
    parts.push(escapeHtml(plain.slice(last)));
  }
  return parts.join("");
}

function paragraphsFromLinkedText(linked: string): string {
  const blocks = linked.split(/\n{2,}/).filter((block) => block.trim());
  return blocks
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export function plainTextToHtml(text: string): string {
  return paragraphsFromLinkedText(escapeHtml(text));
}

export function formatReplyHtml(
  text: string,
  options?: { ctaLink?: string | null },
): string {
  let body = normalizePlainText(text);
  if (!body) {
    body = BEATRICE_SIGNATURE;
  }

  const ctaLink = options?.ctaLink?.trim() ?? "";
  if (ctaLink) {
    body = ensureCtaPresent(body, ctaLink);
  }

  body = ensureBeatriceSignature(body);
  const linked = plainToLinkedHtml(body);
  return paragraphsFromLinkedText(linked);
}
