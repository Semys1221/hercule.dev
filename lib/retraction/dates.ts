import { COMMERCIAL, COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

import type { RetractionStatus } from "./types";
import type { LeadCategory } from "@/lib/link-tracking/types";

/** Add N calendar days to a reference date. */
export function addCalendarDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

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

export function agenceFirstContratCalendarDays(
  status: RetractionStatus,
  isFastCheckout: boolean,
): number {
  if (isFastCheckout) {
    const base = COMMERCIAL.agenceFastFirstRdvWorkingDays;
    return status === "pending" ? base + COMMERCIAL.retractationDays : base;
  }
  const base = COMMERCIAL.agenceStandardFirstRdvCalendarDays;
  return status === "pending" ? base + COMMERCIAL.retractationDays : base;
}

export function agenceFirstContratAt(
  activation: Date,
  status: RetractionStatus,
  isFastCheckout: boolean,
): Date {
  const days = agenceFirstContratCalendarDays(status, isFastCheckout);
  return isFastCheckout ? addWorkingDays(activation, days) : addCalendarDays(activation, days);
}

/** Comptable — fourchette SLA premier RDV planifié (jours calendaires après activation). */
export function comptableFirstRdvRangeAt(activation: Date): { min: Date; max: Date } {
  return {
    min: addCalendarDays(activation, COMMERCIAL_COMPTABLE.firstRdvDaysMin),
    max: addCalendarDays(activation, COMMERCIAL_COMPTABLE.firstRdvDaysMax),
  };
}

/** Borne haute utilisée pour estimated_first_booking_at (emails, rappels J±N). */
export function comptableEstimatedFirstBookingAt(activation: Date): Date {
  return comptableFirstRdvRangeAt(activation).max;
}

export function comptableFirstRdvCalendarDays(_status: RetractionStatus): number {
  return COMMERCIAL_COMPTABLE.firstRdvDaysMax;
}

/** @deprecated Prefer agenceFirstContratCalendarDays — kept for DashboardRetraction field. */
export function firstContratWorkingDays(
  status: RetractionStatus,
  isFastCheckout = false,
): number {
  return agenceFirstContratCalendarDays(status, isFastCheckout);
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

export function formatFrenchDateRange(min: Date, max: Date): string {
  const sameYear = min.getFullYear() === max.getFullYear();
  const sameMonth = sameYear && min.getMonth() === max.getMonth();

  if (sameMonth) {
    return `${min.getDate()} à ${formatFrenchDate(max)}`;
  }

  if (sameYear) {
    const minLabel = min.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
    return `${minLabel} à ${formatFrenchDate(max)}`;
  }

  return `${formatFrenchDate(min)} à ${formatFrenchDate(max)}`;
}

export function estimatedFirstBookingAt(
  activation: Date,
  status: RetractionStatus,
  isFastCheckout = false,
  category: LeadCategory = "agence",
): Date {
  if (category === "comptable" || category === "cif") {
    return comptableEstimatedFirstBookingAt(activation);
  }
  return agenceFirstContratAt(activation, status, isFastCheckout);
}
