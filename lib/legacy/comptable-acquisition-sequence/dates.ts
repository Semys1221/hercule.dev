import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import { formatMeetingDateTime } from "@/lib/legacy/booking-communication/templates";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function trackingNumberForSlug(slug: string): string {
  return `HRC-${slug}`;
}

export function estimatedFirstRdvAtFromPayment(paymentAt: Date): Date {
  return new Date(
    paymentAt.getTime() +
      COMMERCIAL_COMPTABLE.acquisition1489FirstRdvCalendarDays * MS_PER_DAY,
  );
}

export function formatEstimatedFirstRdvDate(paymentAt: Date): string {
  return formatMeetingDateTime(estimatedFirstRdvAtFromPayment(paymentAt).toISOString()).date;
}

export function acquisitionRdvRangeLabel(): string {
  return `${COMMERCIAL_COMPTABLE.acquisition1489RdvMin} à ${COMMERCIAL_COMPTABLE.acquisition1489RdvMax}`;
}
