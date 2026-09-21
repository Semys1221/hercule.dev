"use client";

import { useMemo } from "react";

import { InternalMetricRow } from "@/components/legacy/internal/ui/internal-metric-row";
import { InternalStatusAlert } from "@/components/legacy/internal/funnels/ui/internal-status-alert";
import type { BookingsCampaignStats } from "@/lib/legacy/admin/bookings/bookings-page-cache";
import {
  computeExtendedBookingStats,
  formatBookingPercent,
} from "@/lib/legacy/admin/bookings/stats";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";

type BookingsStatsBarProps = {
  rows: EnrichedCalendlyBooking[];
  campaignLinked?: boolean;
  campaignStats?: BookingsCampaignStats | null;
  statsLoading?: boolean;
  statsError?: string | null;
};

function formatOutreachMetric(
  value: number | null,
  statsLoading: boolean,
  outreachLinked: boolean,
): string {
  if (statsLoading && !outreachLinked) {
    return "…";
  }
  if (value === null) {
    return "—";
  }
  return String(value);
}

function formatOutreachPercent(
  value: number | null,
  statsLoading: boolean,
  outreachLinked: boolean,
): string {
  if (statsLoading && !outreachLinked) {
    return "…";
  }
  return formatBookingPercent(value);
}

export function BookingsStatsBar({
  rows,
  campaignLinked = false,
  campaignStats = null,
  statsLoading = false,
  statsError = null,
}: BookingsStatsBarProps) {
  const outreachLinked = Boolean(
    campaignStats?.linked &&
      typeof campaignStats.sent === "number" &&
      campaignStats.sent > 0,
  );

  const outreach = useMemo(
    () =>
      outreachLinked
        ? {
            sent: campaignStats!.sent!,
            replies: campaignStats!.replies ?? 0,
            interested: campaignStats!.interested ?? 0,
          }
        : null,
    [campaignStats, outreachLinked],
  );

  const stats = useMemo(
    () =>
      computeExtendedBookingStats(
        rows.map((row) => ({
          startTime: row.start_time,
          salesCallStatus: row.sales_call_status,
        })),
        outreach,
      ),
    [rows, outreach],
  );

  const bookingRateLabel = useMemo(() => {
    if (statsLoading && !outreachLinked) {
      return "…";
    }
    if (stats.bookingRate === null) {
      return "—";
    }
    return formatBookingPercent(stats.bookingRate);
  }, [stats.bookingRate, statsLoading, outreachLinked]);

  const campaignHint = useMemo(() => {
    if (!campaignLinked && !campaignStats?.linked) {
      return "Lier une campagne via Connexions pour le booking rate";
    }
    if (campaignStats?.linked && (campaignStats.sent ?? 0) <= 0) {
      return "Campagne liée sans emails envoyés — vérifiez la sélection dans Connexions";
    }
    if (stats.sent !== null && stats.sent > 0) {
      return `${stats.totalBooked} bookings sur ${stats.sent} sent`;
    }
    return undefined;
  }, [
    campaignLinked,
    campaignStats?.linked,
    campaignStats?.sent,
    stats.sent,
    stats.totalBooked,
  ]);

  const noShowHint = `${formatBookingPercent(stats.noShowPercent)} · sur ${stats.pastBooked} passés`;
  const soldHint = `${formatBookingPercent(stats.soldPercent)} · sur ${stats.pastBooked} passés`;

  return (
    <div className="flex flex-col gap-4">
      {statsError ? (
        <InternalStatusAlert variant="error" message={statsError} />
      ) : null}

      <InternalMetricRow
        title="Outreach Instantly"
        columns={4}
        metrics={[
          { label: "Taux de booking", value: bookingRateLabel, hint: campaignHint },
          {
            label: "Envoyés",
            value: formatOutreachMetric(stats.sent, statsLoading, outreachLinked),
          },
          {
            label: "Taux de réponse",
            value: formatOutreachPercent(stats.replyPercent, statsLoading, outreachLinked),
          },
          {
            label: "Taux positif",
            value: formatOutreachPercent(stats.positivePercent, statsLoading, outreachLinked),
          },
        ]}
      />

      <InternalMetricRow
        title="Pipeline RDV"
        columns={5}
        metrics={[
          { label: "À venir", value: String(stats.upcomingBooked) },
          { label: "Total", value: String(stats.totalBooked) },
          { label: "Passés", value: String(stats.pastBooked) },
          { label: "No-show", value: String(stats.noShowCount), hint: noShowHint },
          { label: "Sold", value: String(stats.soldCount), hint: soldHint },
        ]}
      />
    </div>
  );
}
