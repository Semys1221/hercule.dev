export const BEATRICE_SIGNATURE = "Béatrice Meyer";
export const HERCULE_SIGNATURE_TAGLINE = "hercule.dev Courtage contrat BNC/BIC";
export const HERCULE_WEBSITE_URL = "https://hercule.dev";

export const OUTREACH_SIGNATURE_PLAIN = [
  BEATRICE_SIGNATURE,
  HERCULE_SIGNATURE_TAGLINE,
  HERCULE_WEBSITE_URL,
].join("\n");

export const OUTREACH_SIGNATURE_HTML =
  `${BEATRICE_SIGNATURE}<br/>${HERCULE_SIGNATURE_TAGLINE}<br/><a href="${HERCULE_WEBSITE_URL}">hercule.dev</a>`;

const SIGNATURE_MARKERS = [BEATRICE_SIGNATURE, "Beatrice Meyer"] as const;
const HERCULE_URL_RE = /https?:\/\/(?:www\.)?hercule\.dev(?:\/[^\s]*)?/i;

function signatureIndex(text: string): number {
  for (const marker of SIGNATURE_MARKERS) {
    const idx = text.lastIndexOf(marker);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function hasExplicitHerculeUrl(text: string): boolean {
  return HERCULE_URL_RE.test(text);
}

/** Ensure outreach plain-text signature: name, tagline, then https://hercule.dev URL. */
export function ensureOutreachSignature(text: string): string {
  let body = text;

  if (signatureIndex(body) < 0) {
    body = `${body.replace(/\s+$/, "")}\n\n${BEATRICE_SIGNATURE}`;
  }

  const idx = signatureIndex(body);
  const afterSignature = body.slice(idx);

  if (!afterSignature.includes(HERCULE_SIGNATURE_TAGLINE)) {
    body = `${body.replace(/\s+$/, "")}\n${HERCULE_SIGNATURE_TAGLINE}`;
  }

  if (!hasExplicitHerculeUrl(body)) {
    body = `${body.replace(/\s+$/, "")}\n${HERCULE_WEBSITE_URL}`;
  }

  return body;
}

/** @deprecated Use ensureOutreachSignature — kept for existing imports. */
export function ensureBeatriceSignature(text: string): string {
  return ensureOutreachSignature(text);
}
