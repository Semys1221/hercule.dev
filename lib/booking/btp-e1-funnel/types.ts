export type BtpE1FunnelMetrics = {
  emailsE1Sent: number;
  clicks: number;
  bookings: number;
  clickRateFromEmails: number | null;
  bookingRateFromClicks: number | null;
  bookingRateFromEmails: number | null;
  recentClicks: { clickedAt: string }[];
  fetchedAt: string;
};
