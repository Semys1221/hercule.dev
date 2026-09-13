"use client";

import { useMemo } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BookingsCampaignStats } from "@/lib/admin/bookings/bookings-page-cache";
import {
  computeExtendedBookingStats,
  formatBookingPercent,
} from "@/lib/admin/bookings/stats";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";

type BookingsStatsBarProps = {
  rows: EnrichedCalendlyBooking[];
  campaignLinked?: boolean;
  campaignStats?: BookingsCampaignStats | null;
  statsLoading?: boolean;
  statsError?: string | null;
};

function BookingsMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-0 py-4 shadow-none">
      <CardHeader className="gap-1 px-4 pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardFooter className="px-4 pt-0 text-xs text-muted-foreground">{hint}</CardFooter>
      ) : null}
    </Card>
  );
}

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

  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8f3f56" },
    body: JSON.stringify({
      sessionId: "8f3f56",
      runId: "post-fix",
      hypothesisId: "D",
      location: "bookings-stats-bar.tsx:render",
      message: "booking rate render inputs",
      data: {
        isClient: typeof window !== "undefined",
        statsLoading,
        outreachLinked,
        rowsCount: rows.length,
        totalBooked: stats.totalBooked,
        sent: stats.sent,
        bookingRate: stats.bookingRate,
        bookingRateLabel,
        campaignStatsLinked: campaignStats?.linked ?? null,
        campaignStatsSent: campaignStats?.sent ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground">Outreach Instantly</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <BookingsMetricCard
            label="Taux de booking"
            value={bookingRateLabel}
            hint={campaignHint}
          />
          <BookingsMetricCard
            label="Envoyés"
            value={formatOutreachMetric(stats.sent, statsLoading, outreachLinked)}
          />
          <BookingsMetricCard
            label="Taux de réponse"
            value={formatOutreachPercent(stats.replyPercent, statsLoading, outreachLinked)}
          />
          <BookingsMetricCard
            label="Taux positif"
            value={formatOutreachPercent(stats.positivePercent, statsLoading, outreachLinked)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-muted-foreground">Pipeline RDV</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <BookingsMetricCard label="À venir" value={String(stats.upcomingBooked)} />
          <BookingsMetricCard label="Total" value={String(stats.totalBooked)} />
          <BookingsMetricCard label="Passés" value={String(stats.pastBooked)} />
          <BookingsMetricCard
            label="No-show"
            value={String(stats.noShowCount)}
            hint={noShowHint}
          />
          <BookingsMetricCard
            label="Sold"
            value={String(stats.soldCount)}
            hint={soldHint}
          />
        </div>
      </div>
    </div>
  );
}
