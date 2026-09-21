import type { CalendlyBookingRow } from "@/lib/legacy/calendly/list-bookings";
import { normalizeEmail } from "@/lib/legacy/link-tracking/supabase";

/** Internal / test bookings excluded from the bookings CRM pipeline. */
const EXCLUDED_BOOKING_EMAILS = new Set([
  "nanguy29@gmail.com",
  "pierresinclair73@gmail.com",
]);

function bookingDedupKey(row: CalendlyBookingRow): string {
  return `${normalizeEmail(row.email)}|${row.start_time}`;
}

function bookingRowRank(row: CalendlyBookingRow): number {
  let rank = 0;
  if (row.invitee_status === "active") {
    rank += 4;
  }
  if (row.event_status === "active") {
    rank += 2;
  }
  if (row.lead_id) {
    rank += 1;
  }
  return rank;
}

export function isExcludedBookingRow(
  row: Pick<CalendlyBookingRow, "email" | "name">,
): boolean {
  const email = normalizeEmail(row.email);
  if (EXCLUDED_BOOKING_EMAILS.has(email)) {
    return true;
  }

  const name = row.name.trim().toLowerCase();
  if (!name) {
    return false;
  }

  if (name === "evan" || name.includes("evan nanguy") || name.includes("nanguy evan")) {
    return true;
  }

  return name.includes("pierre sinclair") || (name.includes("pierre") && name.includes("sinclair"));
}

export function dedupeBookingRows(rows: CalendlyBookingRow[]): CalendlyBookingRow[] {
  const bestByKey = new Map<string, CalendlyBookingRow>();

  for (const row of rows) {
    const key = bookingDedupKey(row);
    const existing = bestByKey.get(key);
    if (!existing || bookingRowRank(row) > bookingRowRank(existing)) {
      bestByKey.set(key, row);
    }
  }

  return [...bestByKey.values()];
}

export function finalizeBookingRows(rows: CalendlyBookingRow[]): CalendlyBookingRow[] {
  return dedupeBookingRows(rows).filter((row) => !isExcludedBookingRow(row));
}
