export const MIN_LEAD_MS = 2 * 60 * 60 * 1000;
export const WARNING_BEFORE_MS = 3 * 60 * 60 * 1000;
export const ENFORCE_CANCEL_BEFORE_MS = 1 * 60 * 60 * 1000;

export function isTooSoonForModalites(
  scheduledAt: Date,
  now = new Date(),
): boolean {
  return scheduledAt.getTime() - now.getTime() < MIN_LEAD_MS;
}

function clampToNow(candidate: Date, now: Date): Date {
  return new Date(Math.max(candidate.getTime(), now.getTime()));
}

/** Mail 2 — rappel H-3 (ou immédiat si le créneau est plus tôt). */
export function modalitesWarningAt(scheduledAt: Date, now = new Date()): Date {
  const at = new Date(scheduledAt.getTime() - WARNING_BEFORE_MS);
  return clampToNow(at, now);
}

/** Annulation Calendly silencieuse H-1 (pas d'email). */
export function modalitesEnforceCancelAt(
  scheduledAt: Date,
  now = new Date(),
): Date {
  const at = new Date(scheduledAt.getTime() - ENFORCE_CANCEL_BEFORE_MS);
  return clampToNow(at, now);
}

/** @deprecated Use modalitesWarningAt */
export function modalitesCancelAt(scheduledAt: Date, now = new Date()): Date {
  return modalitesWarningAt(scheduledAt, now);
}
