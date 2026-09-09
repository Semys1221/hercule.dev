import { COMMERCIAL } from "@/lib/commercial/constants";

import type { RetractionStatus } from "./types";

/** Add N working days (Mon–Fri) to a reference date. */
export function addWorkingDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

export function computeRetractionEndsAt(from: Date): Date {
  const ends = new Date(from);
  ends.setDate(ends.getDate() + COMMERCIAL.retractationDays);
  return ends;
}

export function firstContratWorkingDays(status: RetractionStatus): number {
  if (status === "pending") {
    return 11;
  }
  return 7;
}

export function activationAt(params: {
  status: RetractionStatus;
  waivedAt: string | null;
  endsAt: string | null;
  completedAt: string | null;
}): Date | null {
  const { status, waivedAt, endsAt, completedAt } = params;

  if (status === "waived" && waivedAt) {
    return new Date(waivedAt);
  }
  if (status === "expired" && endsAt) {
    return new Date(endsAt);
  }
  if (status === "pending" && endsAt) {
    return new Date(endsAt);
  }
  if (status === "n_a" && completedAt) {
    return new Date(completedAt);
  }
  return null;
}

export function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function estimatedFirstBookingAt(activation: Date, status: RetractionStatus): Date {
  return addWorkingDays(activation, firstContratWorkingDays(status));
}
