import { COMMERCIAL } from "@/lib/commercial/constants";

import type { RetractionStatus } from "./types";

export function retractionDaysForStatus(status: RetractionStatus): number {
  if (status === "pending") {
    return COMMERCIAL.retractationDays;
  }
  return 0;
}

export function droitRetractationFromStatus(status: RetractionStatus): boolean {
  return status === "pending";
}

/** Sync profile.form + profile.communication.delays from retraction status. */
export function syncProfileRetraction(
  profile: Record<string, unknown>,
  status: RetractionStatus,
): Record<string, unknown> {
  const next = { ...profile };
  const form = { ...((next.form ?? {}) as Record<string, unknown>) };
  const communication = {
    ...((next.communication ?? {}) as Record<string, unknown>),
  };
  const delays = {
    ...((communication.delays ?? {}) as Record<string, unknown>),
  };

  const retractionDays = retractionDaysForStatus(status);
  form.droit_retractation = droitRetractationFromStatus(status);
  delays.retraction_days = retractionDays;
  delays.search_start_offset_days = retractionDays;

  communication.delays = delays;
  next.form = form;
  next.communication = communication;
  return next;
}

/** Default profile delays for a new agence/comptable lead (retraction on by default). */
export function defaultRetractionProfilePatch(): {
  droit_retractation: boolean;
  retraction_days: number;
  search_start_offset_days: number;
} {
  return {
    droit_retractation: true,
    retraction_days: COMMERCIAL.retractationDays,
    search_start_offset_days: COMMERCIAL.retractationDays,
  };
}
