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

export type OutreachStatsInput = {
  sent: number;
  replies?: number;
  interested?: number;
};

export type ExtendedBookingStats = BookingStats & {
  bookingRate: number | null;
  sent: number | null;
  replyPercent: number | null;
  positivePercent: number | null;
};

function isPastBooking(startTime: string, now = Date.now()): boolean {
  const scheduledAt = new Date(startTime).getTime();
  if (Number.isNaN(scheduledAt)) {
    return false;
  }
  return scheduledAt < now;
}

export function percent(count: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((count / total) * 1000) / 10;
}

export function computeBookingRate(booked: number, sent: number): number | null {
  return percent(booked, sent);
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

export function computeExtendedBookingStats(
  rows: BookingStatsInput[],
  outreach?: OutreachStatsInput | null,
  now = Date.now(),
): ExtendedBookingStats {
  const base = computeBookingStats(rows, now);
  const sent = outreach?.sent ?? null;
  const replyPercent =
    outreach && sent !== null
      ? percent(outreach.replies ?? 0, sent)
      : null;
  const positivePercent =
    outreach && sent !== null
      ? percent(outreach.interested ?? 0, sent)
      : null;

  return {
    ...base,
    bookingRate: sent !== null ? computeBookingRate(base.totalBooked, sent) : null,
    sent,
    replyPercent,
    positivePercent,
  };
}

export function formatBookingPercent(value: number | null): string {
  if (value === null) {
    return "—";
  }
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${label} %`;
}

export function formatBookingRateLabel(
  booked: number,
  rate: number | null,
): string {
  if (rate === null) {
    return String(booked);
  }
  return `${booked} (${formatBookingPercent(rate).replace(" %", " %")})`;
}
