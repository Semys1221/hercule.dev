import { revalidateTag } from "next/cache";

import {
  BOOKINGS_CACHE_REVALIDATE_SECONDS,
  bookingsCacheTag,
} from "@/lib/legacy/calendly/bookings-cache-constants";

export { BOOKINGS_CACHE_REVALIDATE_SECONDS, bookingsCacheTag };

export function revalidateBookingsCache(niche?: string) {
  if (niche) {
    revalidateTag(bookingsCacheTag(niche), "max");
    return;
  }
  revalidateTag("bookings:agence", "max");
  revalidateTag("bookings:comptable", "max");
  revalidateTag("bookings:entreprise", "max");
  revalidateTag("bookings:cif", "max");
}
