import { revalidateTag } from "next/cache";

export const BOOKINGS_CACHE_TAG = "bookings-agence";
export const BOOKINGS_CACHE_REVALIDATE_SECONDS = 300;

export function revalidateBookingsCache() {
  revalidateTag(BOOKINGS_CACHE_TAG, "max");
}
