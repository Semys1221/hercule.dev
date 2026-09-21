export const BEATRICE_SIGNATURE = "Béatrice Meyer";
export const HERCULE_SIGNATURE_TAGLINE = "Hercule, Courtage contrat BNC/BIC";
export const HERCULE_SIGNATURE_TAGLINE_LEGACY = "hercule.dev Courtage contrat BNC/BIC";
export const HERCULE_SIGNATURE_TAGLINE_SUFFIX = "Courtage contrat BNC/BIC";
export const HERCULE_SIGNATURE_TAGLINE_HTML = `Hercule, <i>${HERCULE_SIGNATURE_TAGLINE_SUFFIX}</i>`;
export const CORDIALEMENT_CLOSING = "Cordialement,";
export const HERCULE_WEBSITE_URL = "https://hercule.dev";

export const OUTREACH_SIGNATURE_PLAIN = [
  CORDIALEMENT_CLOSING,
  BEATRICE_SIGNATURE,
  HERCULE_SIGNATURE_TAGLINE,
].join("\n");

export const OUTREACH_SIGNATURE_HTML =
  `${BEATRICE_SIGNATURE}<br/>${HERCULE_SIGNATURE_TAGLINE}<br/><a href="${HERCULE_WEBSITE_URL}">hercule.dev</a>`;

const SIGNATURE_MARKERS = [BEATRICE_SIGNATURE, "Beatrice Meyer"] as const;

function signatureIndex(text: string): number {
  for (const marker of SIGNATURE_MARKERS) {
    const idx = text.lastIndexOf(marker);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function normalizeLegacySignatureTagline(text: string): string {
  return text.replaceAll(HERCULE_SIGNATURE_TAGLINE_LEGACY, HERCULE_SIGNATURE_TAGLINE);
}

function stripTrailingSignatureSiteUrl(text: string): string {
  const idx = signatureIndex(text);
  if (idx < 0) {
    return text;
  }
  const signatureBlock = text.slice(idx);
  const trimmed = signatureBlock.replace(
    /\nhttps?:\/\/(?:www\.)?hercule\.dev\/?\s*$/i,
    "",
  );
  if (trimmed === signatureBlock) {
    return text;
  }
  return `${text.slice(0, idx)}${trimmed}`.trimEnd();
}

/** Ensure reply-agent plain-text closing: Cordialement, name, tagline (no trailing site URL). */
export function ensureOutreachSignature(text: string): string {
  let body = normalizeLegacySignatureTagline(text);
  body = stripTrailingSignatureSiteUrl(body);

  if (signatureIndex(body) < 0) {
    body = `${body.replace(/\s+$/, "")}\n\n${BEATRICE_SIGNATURE}`;
  }

  const idx = signatureIndex(body);
  const beforeSignature = body.slice(0, idx).trimEnd();
  const afterSignature = body.slice(idx);

  if (!afterSignature.includes(HERCULE_SIGNATURE_TAGLINE)) {
    body = `${beforeSignature}\n\n${BEATRICE_SIGNATURE}\n${HERCULE_SIGNATURE_TAGLINE}`;
  }

  return stripTrailingSignatureSiteUrl(body);
}

export function ensureCordialementClosing(text: string): string {
  if (text.includes(CORDIALEMENT_CLOSING)) {
    return text;
  }
  const idx = signatureIndex(text);
  if (idx < 0) {
    return `${text.replace(/\s+$/, "")}\n\n${CORDIALEMENT_CLOSING}\n\n${BEATRICE_SIGNATURE}`;
  }
  const prefix = text.slice(0, idx).trimEnd();
  const signatureAndAfter = text.slice(idx);
  return `${prefix}\n\n${CORDIALEMENT_CLOSING}\n\n${signatureAndAfter}`;
}

/** Collapse blank lines between name and tagline in the outreach signature block. */
export function normalizeSignatureSpacing(text: string): string {
  let out = text;
  for (const marker of SIGNATURE_MARKERS) {
    const pattern = new RegExp(
      `(${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?:[ \\t]*\\n[ \\t]*)+(${HERCULE_SIGNATURE_TAGLINE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    );
    out = out.replace(pattern, "$1\n$2");
  }
  return out;
}

/** @deprecated Use ensureOutreachSignature — kept for existing imports. */
export function ensureBeatriceSignature(text: string): string {
  return ensureOutreachSignature(text);
}
