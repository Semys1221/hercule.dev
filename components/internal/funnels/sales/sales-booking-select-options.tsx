"use client";

import {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { formatParisDateTime } from "@/lib/admin/bookings/booking-rdv-label";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { isUpcomingBooking } from "@/lib/calendly/list-bookings";
import { cn } from "@/lib/utils";

export function salesBookingLabel(booking: EnrichedCalendlyBooking): string {
  const name = booking.first_name || booking.name || booking.email;
  return `${name} — ${booking.email} — RDV ${formatParisDateTime(booking.start_time)}`;
}

export function partitionSalesBookings(bookings: EnrichedCalendlyBooking[]) {
  const upcoming: EnrichedCalendlyBooking[] = [];
  const past: EnrichedCalendlyBooking[] = [];

  for (const booking of bookings) {
    if (isUpcomingBooking(booking.start_time)) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }

  upcoming.sort((a, b) => a.start_time.localeCompare(b.start_time));
  past.sort((a, b) => b.start_time.localeCompare(a.start_time));

  return { upcoming, past };
}

function bookingItemClassName(upcoming: boolean): string {
  return cn(
    upcoming
      ? "border-l-2 border-l-primary bg-primary/5 focus:bg-primary/10 data-[highlighted]:bg-primary/10"
      : "border-l-2 border-l-muted-foreground/30 text-muted-foreground focus:bg-muted/50 focus:text-muted-foreground data-[highlighted]:bg-muted/40",
  );
}

type SalesBookingSelectOptionsProps = {
  bookings: EnrichedCalendlyBooking[];
  labelFor?: (booking: EnrichedCalendlyBooking) => string;
};

export function SalesBookingSelectOptions({
  bookings,
  labelFor = salesBookingLabel,
}: SalesBookingSelectOptionsProps) {
  const { upcoming, past } = partitionSalesBookings(bookings);

  return (
    <>
      {upcoming.length > 0 ? (
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold tracking-wide text-primary uppercase">
            À venir
          </SelectLabel>
          {upcoming.map((booking) => (
            <SelectItem
              key={booking.invitee_uri}
              value={booking.invitee_uri}
              className={bookingItemClassName(true)}
            >
              {labelFor(booking)}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
      {upcoming.length > 0 && past.length > 0 ? <SelectSeparator /> : null}
      {past.length > 0 ? (
        <SelectGroup>
          <SelectLabel className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Passés
          </SelectLabel>
          {past.map((booking) => (
            <SelectItem
              key={booking.invitee_uri}
              value={booking.invitee_uri}
              className={bookingItemClassName(false)}
            >
              {labelFor(booking)}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : null}
    </>
  );
}

export function salesBookingValueClassName(startTime: string): string {
  return isUpcomingBooking(startTime) ? "text-foreground" : "text-muted-foreground";
}
