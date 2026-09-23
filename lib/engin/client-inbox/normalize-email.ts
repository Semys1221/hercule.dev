export function normalizeEmailAddress(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const angle = trimmed.match(/<([^>]+)>/);
  const candidate = (angle?.[1] ?? trimmed).trim().toLowerCase();
  if (!candidate.includes("@")) return null;
  return candidate;
}

export function parseFromHeader(value: string): string | null {
  return normalizeEmailAddress(value);
}

export function parseAddressListHeader(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  const parts = value.split(",");
  const out: string[] = [];
  for (const part of parts) {
    const normalized = normalizeEmailAddress(part);
    if (normalized) out.push(normalized);
  }
  return out;
}
