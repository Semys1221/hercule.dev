export const MIN_LEAD_MS = 2 * 60 * 60 * 1000;

/** @deprecated Meeting-relative H-3 — use MODALITES_WARNING_AFTER_MS */
export const WARNING_BEFORE_MS = 3 * 60 * 60 * 1000;

/** @deprecated Meeting-relative H-1 — use MODALITES_ENFORCE_AFTER_MS */
export const ENFORCE_CANCEL_BEFORE_MS = 1 * 60 * 60 * 1000;

export const MODALITES_WARNING_AFTER_MS = 23 * 60 * 60 * 1000;
export const MODALITES_ENFORCE_AFTER_MS = 24 * 60 * 60 * 1000;

export function isTooSoonForModalites(
  scheduledAt: Date,
  now = new Date(),
): boolean {
  return scheduledAt.getTime() - now.getTime() < MIN_LEAD_MS;
}

function clampToNow(candidate: Date, now: Date): Date {
  return new Date(Math.max(candidate.getTime(), now.getTime()));
}

/** Mail 2 — rappel T+23h après envoi du mail 1. */
export function modalitesWarningAtFromAskSent(
  askSentAt: Date,
  now = new Date(),
): Date {
  const at = new Date(askSentAt.getTime() + MODALITES_WARNING_AFTER_MS);
  return clampToNow(at, now);
}

/** Annulation Calendly silencieuse T+24h après envoi du mail 1. */
export function modalitesEnforceCancelAtFromAskSent(
  askSentAt: Date,
  now = new Date(),
): Date {
  const at = new Date(askSentAt.getTime() + MODALITES_ENFORCE_AFTER_MS);
  return clampToNow(at, now);
}

/** @deprecated Use modalitesWarningAtFromAskSent — meeting-relative H-3 */
export function modalitesWarningAt(scheduledAt: Date, now = new Date()): Date {
  const at = new Date(scheduledAt.getTime() - WARNING_BEFORE_MS);
  return clampToNow(at, now);
}

/** @deprecated Use modalitesEnforceCancelAtFromAskSent — meeting-relative H-1 */
export function modalitesEnforceCancelAt(
  scheduledAt: Date,
  now = new Date(),
): Date {
  const at = new Date(scheduledAt.getTime() - ENFORCE_CANCEL_BEFORE_MS);
  return clampToNow(at, now);
}

/** @deprecated Use modalitesWarningAtFromAskSent */
export function modalitesCancelAt(scheduledAt: Date, now = new Date()): Date {
  return modalitesWarningAt(scheduledAt, now);
}
