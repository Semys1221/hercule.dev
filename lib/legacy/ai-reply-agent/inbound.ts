export const INBOUND_TEXT_MAX_CHARS = 2000;

export function truncateInboundText(text: string, maxChars = INBOUND_TEXT_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed || "(empty body)";
  }
  return `${trimmed.slice(0, maxChars - 1)}…`;
}
