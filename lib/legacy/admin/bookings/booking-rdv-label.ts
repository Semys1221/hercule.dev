const PARIS_TZ = "Europe/Paris";

export function formatParisDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function bookingRelativeHint(iso: string, now = Date.now()): string | null {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) {
    return null;
  }

  const diffMs = start - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs > 0) {
    if (diffDays === 0) {
      return "Aujourd'hui";
    }
    if (diffDays === 1) {
      return "Demain";
    }
    return `Dans ${diffDays} j`;
  }

  if (diffDays === 0) {
    return "Passé";
  }
  if (diffDays === -1) {
    return "Hier";
  }
  return `Il y a ${Math.abs(diffDays)} j`;
}

export type BookingTimeFilter = "upcoming" | "past" | "all";

export function matchesBookingTimeFilter(
  startTime: string,
  filter: BookingTimeFilter,
  now = Date.now(),
): boolean {
  const start = new Date(startTime).getTime();
  if (Number.isNaN(start)) {
    return filter === "all";
  }
  if (filter === "upcoming") {
    return start > now;
  }
  if (filter === "past") {
    return start <= now;
  }
  return true;
}
