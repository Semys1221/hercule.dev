"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  computeBookingStats,
  formatBookingPercent,
} from "@/lib/admin/bookings/stats";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";

type BookingsStatsBarProps = {
  rows: EnrichedCalendlyBooking[];
};

export function BookingsStatsBar({ rows }: BookingsStatsBarProps) {
  const stats = computeBookingStats(
    rows.map((row) => ({
      startTime: row.start_time,
      salesCallStatus: row.sales_call_status,
    })),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Total booked</p>
          <p className="text-2xl font-semibold tabular-nums">{stats.totalBooked}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="px-4 py-3">
          <p className="text-xs text-muted-foreground">No Show</p>
          <p className="text-2xl font-semibold tabular-nums">
            {stats.noShowCount}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({formatBookingPercent(stats.noShowPercent)})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sur {stats.pastBooked} RDV passés
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="px-4 py-3">
          <p className="text-xs text-muted-foreground">Sold</p>
          <p className="text-2xl font-semibold tabular-nums">
            {stats.soldCount}
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({formatBookingPercent(stats.soldPercent)})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sur {stats.pastBooked} RDV passés
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
