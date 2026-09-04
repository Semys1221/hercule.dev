import type { BookingEmailType } from "./types";

const BOOKING_EMAIL_TYPES = new Set<BookingEmailType>([
  "immediate",
  "h48_confirm",
  "h24_relance",
  "h20_cancel",
  "role_seq_48",
  "role_seq_24",
]);

export function verifyBookingCommunicationSecret(request: Request): boolean {
  const expected =
    process.env.LINK_TRACKING_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export function parseEmailTypes(value: unknown): BookingEmailType[] | null {
  if (value == null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return null;
  }
  const types: BookingEmailType[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !BOOKING_EMAIL_TYPES.has(item as BookingEmailType)) {
      return null;
    }
    types.push(item as BookingEmailType);
  }
  return types;
}

export function parseHtmlByType(
  value: unknown,
): Partial<Record<BookingEmailType, boolean>> | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const result: Partial<Record<BookingEmailType, boolean>> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (!BOOKING_EMAIL_TYPES.has(key as BookingEmailType)) {
      return null;
    }
    if (typeof val !== "boolean") {
      return null;
    }
    result[key as BookingEmailType] = val;
  }
  return result;
}

export function isBookingEmailType(value: unknown): value is BookingEmailType {
  return typeof value === "string" && BOOKING_EMAIL_TYPES.has(value as BookingEmailType);
}
