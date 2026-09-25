export function computeFunnelRates(
  emailsE1Sent: number,
  clicks: number,
  bookings: number,
): {
  clickRateFromEmails: number | null;
  bookingRateFromClicks: number | null;
  bookingRateFromEmails: number | null;
} {
  const clickRateFromEmails =
    emailsE1Sent > 0 ? clicks / emailsE1Sent : null;
  const bookingRateFromClicks = clicks > 0 ? bookings / clicks : null;
  const bookingRateFromEmails =
    emailsE1Sent > 0 ? bookings / emailsE1Sent : null;

  return {
    clickRateFromEmails,
    bookingRateFromClicks,
    bookingRateFromEmails,
  };
}

export function formatRate(rate: number | null): string {
  if (rate === null || Number.isNaN(rate)) {
    return "—";
  }
  return `${(rate * 100).toFixed(1)} %`;
}
