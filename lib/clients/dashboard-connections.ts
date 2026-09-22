export const CALENDAR_CONNECTED_PROFILE_KEY = "calendar_connected";
export const CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY = "calendly_bookings_enabled";

export function isCalendarConnected(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  const value = profile?.[CALENDAR_CONNECTED_PROFILE_KEY];
  if (typeof value === "boolean") return value;
  return true;
}

export function isCalendlyBookingsEnabled(
  profile: Record<string, unknown> | null | undefined,
): boolean {
  return profile?.[CALENDLY_BOOKINGS_ENABLED_PROFILE_KEY] === true;
}
