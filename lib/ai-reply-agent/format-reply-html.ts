const HERCULE_WEBSITE_URL = "https://hercule.dev";
export const BEATRICE_SIGNATURE = "Béatrice Meyer";

const RESERVATION_PATH_RE = /reservation(?:-entreprise)?\.html|\/r\/comptable\//i;
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
  body = structureReplyPlaintext(body);
  const linked = plainToLinkedHtml(body);
  const htmlOut = paragraphsFromLinkedText(linked);
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "000421",
    },
    body: JSON.stringify({
      sessionId: "000421",
      runId: "format",
      hypothesisId: "A",
      location: "format-reply-html.ts:formatReplyHtml",
      message: "reply html formatted",
      data: {
        inputNewlines: body.split("\n").length - 1,
        paragraphCount: (htmlOut.match(/<p>/g) ?? []).length,
        hasReserverLink: htmlOut.includes("Réserver</a>"),
        hasRawHttps: htmlOut.includes("https://") && !htmlOut.includes("<a href="),
        htmlPreview: htmlOut.slice(0, 240),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return htmlOut;
}
