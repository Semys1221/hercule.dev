import type { ClientCalendlySeat } from "@/lib/clients/types";

export const CALENDAR_CONNECTED_PROFILE_KEY = "calendar_connected";
export const CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY = "calendly_bookings_enabled";

export function isCalendlySeatConnected(
  calendlySeat: ClientCalendlySeat | null | undefined,
): boolean {
  if (!calendlySeat) return false;
  return (
    calendlySeat.invitationStatus === "accepted" || calendlySeat.status === "active"
  );
}

export function isClientCalendarConnected(params: {
  profile: Record<string, unknown> | null | undefined;
  calendlySeat?: ClientCalendlySeat | null;
}): boolean {
  const explicit = params.profile?.[CALENDAR_CONNECTED_PROFILE_KEY];
  if (explicit === true) return true;
  if (isCalendlySeatConnected(params.calendlySeat)) return true;
  if (typeof explicit === "boolean") return explicit;
  return false;
}

/** @deprecated Prefer isClientCalendarConnected with calendlySeat when available. */
export function isCalendarConnected(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  return isClientCalendarConnected({ profile, calendlySeat: null });
}

export function isCalendlyBookingsEnabled(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  return profile?.[CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY] === true;
}
