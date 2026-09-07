import { revalidateTag } from "next/cache";

import {
  BOOKINGS_CACHE_TAG,
  BOOKINGS_CACHE_REVALIDATE_SECONDS,
} from "@/lib/calendly/bookings-cache-constants";

export { BOOKINGS_CACHE_TAG, BOOKINGS_CACHE_REVALIDATE_SECONDS };

export function revalidateBookingsCache() {
  revalidateTag(BOOKINGS_CACHE_TAG, "max");
}
