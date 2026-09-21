import {
  OPT_OUT_DISCLAIMER_HTML,
  OPT_OUT_DISCLAIMER_MARKER,
  OPT_OUT_DISCLAIMER_PLAIN,
} from "@/lib/legacy/lead-relances/disclaimer";
import {
  BEATRICE_SIGNATURE,
  CORDIALEMENT_CLOSING,
  HERCULE_SIGNATURE_TAGLINE,
  HERCULE_SIGNATURE_TAGLINE_HTML,
  HERCULE_SIGNATURE_TAGLINE_LEGACY,
  ensureCordialementClosing,
  ensureOutreachSignature,
  normalizeSignatureSpacing,
} from "@/lib/legacy/outreach-email/signature";

export { BEATRICE_SIGNATURE, ensureBeatriceSignature } from "@/lib/legacy/outreach-email/signature";

const RESERVATION_PATH_RE = /reservation(?:-entreprise)?\.html|\/r\/comptable\//i;
const URL_RE =
  /https?:\/\/[^\s<>]+|(?:www\.)?hercule\.dev[/\w\-.?=&%]*/gi;
const HTTPS_ONLY_URL_RE = /https?:\/\/[^\s<>]+/gi;

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

function structureReplyPlaintext(text: string): string {
  let body = normalizePlainText(text);
  if (!body) {
    return body;
  }

  for (const marker of [BEATRICE_SIGNATURE, "Beatrice Meyer"]) {
    body = body.replace(
      new RegExp(`([^\\n])\\s+(${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`),
      "$1\n\n$2",
    );
  }

  const urlPattern = URL_RE.source;
  body = body.replace(
    new RegExp(`([.!?:])\\s+(${urlPattern})`, "gi"),
    "$1\n\n$2",
  );
  body = body.replace(
    new RegExp(`(ici\\s*:\\s*)(${urlPattern})`, "gi"),
    "$1\n$2",
  );

  const idx = signatureIndex(body);
  if (idx >= 0) {
    for (const marker of [BEATRICE_SIGNATURE, "Beatrice Meyer"]) {
      if (body.slice(idx).startsWith(marker)) {
        const sigEnd = idx + marker.length;
        const rest = body.slice(sigEnd);
        const stripped = rest.trimStart();
        if (stripped && !rest.startsWith("\n")) {
          body = `${body.slice(0, sigEnd)}\n${stripped}`;
        }
        break;
      }
    }
  }

  return body.trim();
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
    return `<strong><a href="${escapedHref}">Réserver</a></strong>`;
  }
  if (isHerculeSiteUrl(url) || url.toLowerCase().includes("hercule.dev")) {
    return `<a href="${escapedHref}">hercule.dev</a>`;
  }
  return `<a href="${escapedHref}">${escapeHtml(url)}</a>`;
}

function linkifyPlainSegment(plain: string, options?: { httpsOnly?: boolean }): string {
  const parts: string[] = [];
  let last = 0;
  const urlPattern = new RegExp(
    options?.httpsOnly ? HTTPS_ONLY_URL_RE.source : URL_RE.source,
    "gi",
  );
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

function plainToLinkedHtml(plain: string): string {
  const idx = signatureIndex(plain);
  if (idx < 0) {
    return linkifyPlainSegment(plain);
  }
  const before = linkifyPlainSegment(plain.slice(0, idx));
  const signatureBlock = linkifyPlainSegment(plain.slice(idx), { httpsOnly: true });
  return before + signatureBlock;
}

function emphasizeReplyLinkedText(linked: string): string {
  let out = linked;
  if (!out.includes("<i>Répondez non")) {
    out = out.replace(
      OPT_OUT_DISCLAIMER_PLAIN,
      `<i>${OPT_OUT_DISCLAIMER_PLAIN}</i>`,
    );
  }
  out = out.replaceAll(HERCULE_SIGNATURE_TAGLINE, HERCULE_SIGNATURE_TAGLINE_HTML);
  out = out.replaceAll(
    HERCULE_SIGNATURE_TAGLINE_LEGACY,
    HERCULE_SIGNATURE_TAGLINE_HTML,
  );
  return out;
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

function normalizeLegacyDisclaimer(text: string): string {
  return text.replace(
    /_Répondez non si vous ne souhaitez plus de messages\._/g,
    OPT_OUT_DISCLAIMER_PLAIN,
  );
}

export function formatReplyHtml(
  text: string,
  options?: { ctaLink?: string | null },
): string {
  let body = normalizePlainText(normalizeLegacyDisclaimer(text));
  if (!body) {
    body = BEATRICE_SIGNATURE;
  }

  const ctaLink = options?.ctaLink?.trim() ?? "";
  if (ctaLink) {
    body = ensureCtaPresent(body, ctaLink);
  }

  body = ensureOutreachSignature(body);
  if (!body.includes(OPT_OUT_DISCLAIMER_MARKER)) {
    const cordIdx = body.indexOf(CORDIALEMENT_CLOSING);
    const sigIdx = signatureIndex(body);
    const insertIdx = cordIdx >= 0 ? cordIdx : sigIdx;
    if (insertIdx >= 0) {
      body = `${body.slice(0, insertIdx).trimEnd()}\n\n${OPT_OUT_DISCLAIMER_PLAIN}\n\n${body.slice(insertIdx)}`;
    } else {
      body = `${body}\n\n${OPT_OUT_DISCLAIMER_PLAIN}`;
    }
  }
  body = ensureCordialementClosing(body);
  body = normalizeSignatureSpacing(body);
  body = structureReplyPlaintext(body);
  let linked = plainToLinkedHtml(body);
  if (!linked.includes(OPT_OUT_DISCLAIMER_MARKER)) {
    const sigIdx = linked.indexOf(BEATRICE_SIGNATURE);
    if (sigIdx >= 0) {
      linked = `${linked.slice(0, sigIdx)}${OPT_OUT_DISCLAIMER_HTML}${linked.slice(sigIdx)}`;
    } else {
      linked = `${linked}${OPT_OUT_DISCLAIMER_HTML}`;
    }
  }
  linked = emphasizeReplyLinkedText(linked);
  const htmlOut = paragraphsFromLinkedText(linked);
  return htmlOut;
}
