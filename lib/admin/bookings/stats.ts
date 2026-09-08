import type { SalesCallStatus } from "@/lib/sales-calls/types";

export type BookingStatsInput = {
  startTime: string;
  salesCallStatus: SalesCallStatus | null;
};

export type BookingStats = {
  totalBooked: number;
  pastBooked: number;
  noShowCount: number;
  noShowPercent: number | null;
  soldCount: number;
  soldPercent: number | null;
};

function isPastBooking(startTime: string, now = Date.now()): boolean {
  const scheduledAt = new Date(startTime).getTime();
  if (Number.isNaN(scheduledAt)) {
    return false;
  }
  return scheduledAt < now;
}

function percent(count: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((count / total) * 100);
}

export function computeBookingStats(
  rows: BookingStatsInput[],
  now = Date.now(),
): BookingStats {
  const pastRows = rows.filter((row) => isPastBooking(row.startTime, now));
  const noShowCount = pastRows.filter(
    (row) => row.salesCallStatus === "no_show",
  ).length;
  const soldCount = pastRows.filter((row) => row.salesCallStatus === "paid").length;

  return {
    totalBooked: rows.length,
    pastBooked: pastRows.length,
    noShowCount,
    noShowPercent: percent(noShowCount, pastRows.length),
    soldCount,
    soldPercent: percent(soldCount, pastRows.length),
  };
}

export function formatBookingPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${value} %`;
}
