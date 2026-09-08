export const BOOKINGS_CACHE_TAG = "bookings-agence";
export const BOOKINGS_CACHE_REVALIDATE_SECONDS = 300;

export function bookingsCacheTag(niche: string): string {
  return `bookings:${niche}`;
}
