const OPT_OUT_PATTERNS: RegExp[] = [
  /\bnon\s+merci\b/i,
  /\bpas\s+int[ée]ress[ée]\b/i,
  /\bne\s+plus\s+me\s+contacter\b/i,
  /\bne\s+me\s+contactez\s+plus\b/i,
  /\barr[êe]tez\s+de\s+me\s+contacter\b/i,
  /\bne\s+relancez\s+plus\b/i,
  /\bd[ée]sinscri/i,
  /\bretirez[- ]moi\b/i,
  /\blaiss(ez)?[- ]moi\s+tranquille\b/i,
  /\bc'?est\s+mort\b/i,
  /\bc'?est\s+bon\b/i,
  /\blaiss(ez)?[- ]tomber\b/i,
  /\bstop\b/i,
  /^non[.!?\s]*$/im,
];

const RECOVERY_NON_MAIS_RE = /\bnon\s+mais\b/i;

function normalizeForOptOut(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function detectOptOut(text: string): boolean {
  const raw = (text || "").trim();
  if (!raw) {
    return false;
  }
  if (RECOVERY_NON_MAIS_RE.test(raw)) {
    return false;
  }
  const normalized = normalizeForOptOut(raw);
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(normalized));
}
