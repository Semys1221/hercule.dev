/** Funnel math: emails → positive responses → bookings (shared with reservation stats UI). */

export function positiveResponseRate(
  emailsRef: number,
  positivesRef: number,
): number {
  if (emailsRef <= 0) {
    return 0;
  }
  return positivesRef / emailsRef;
}

export function rdvFromEmails(
  emails: number,
  positiveRate: number,
  bookingRate: number,
): number {
  return emails * positiveRate * bookingRate;
}

export function emailsForTargetRdv(
  targetRdv: number,
  positiveRate: number,
  bookingRate: number,
): number {
  const denominator = positiveRate * bookingRate;
  if (denominator <= 0) {
    return Infinity;
  }
  return targetRdv / denominator;
}

export function daysToSendVolume(
  emailsNeeded: number,
  emailsPerDay: number,
): number {
  if (emailsPerDay <= 0) {
    return Infinity;
  }
  return emailsNeeded / emailsPerDay;
}

export function formatPercent(rate: number, digits = 3): string {
  return `${(rate * 100).toFixed(digits).replace(".", ",")} %`;
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}
