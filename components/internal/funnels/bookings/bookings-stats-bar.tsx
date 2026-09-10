"use client";

import { useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  computeExtendedBookingStats,
  formatBookingPercent,
} from "@/lib/admin/bookings/stats";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Niche } from "@/lib/admin/navigation";

type BookingsStatsBarProps = {
  niche: Niche;
  rows: EnrichedCalendlyBooking[];
  campaignLinked?: boolean;
};

type CampaignStats = {
  linked: boolean;
  sent?: number;
  replies?: number;
  interested?: number;
  replyPercent?: number | null;
  positivePercent?: number | null;
  error?: string;
};

export function BookingsStatsBar({
  niche,
  rows,
  campaignLinked = false,
}: BookingsStatsBarProps) {
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatsLoading(true);
      setStatsError(null);
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "9da3c4",
        },
        body: JSON.stringify({
          sessionId: "9da3c4",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "bookings-stats-bar.tsx:load:start",
          message: "campaign-stats fetch started",
          data: { niche, rowsLength: rows.length, campaignLinked },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      try {
        const response = await fetch(`/api/admin/niches/${niche}/campaign-stats`);
        const body = (await response.json()) as CampaignStats;
        // #region agent log
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "9da3c4",
          },
          body: JSON.stringify({
            sessionId: "9da3c4",
            runId: "pre-fix",
            hypothesisId: "A",
            location: "bookings-stats-bar.tsx:load:response",
            message: "campaign-stats fetch completed",
            data: {
              niche,
              ok: response.ok,
              cancelled,
              linked: body.linked,
              sent: body.sent,
              error: body.error ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!response.ok) {
          throw new Error(body.error ?? "Stats Instantly indisponibles");
        }
        if (!cancelled) {
          setCampaignStats(body);
        }
      } catch (error) {
        // #region agent log
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "9da3c4",
          },
          body: JSON.stringify({
            sessionId: "9da3c4",
            runId: "pre-fix",
            hypothesisId: "A",
            location: "bookings-stats-bar.tsx:load:error",
            message: "campaign-stats fetch failed or cancelled",
            data: {
              niche,
              cancelled,
              error: error instanceof Error ? error.message : String(error),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!cancelled) {
          setCampaignStats(null);
          setStatsError(
            error instanceof Error ? error.message : "Stats Instantly indisponibles",
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }
    void load();
    return () => {
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "9da3c4",
        },
        body: JSON.stringify({
          sessionId: "9da3c4",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "bookings-stats-bar.tsx:effect:cleanup",
          message: "campaign-stats effect cancelled",
          data: { niche, rowsLength: rows.length },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      cancelled = true;
    };
  }, [niche]);

  const outreach =
    campaignStats?.linked && typeof campaignStats.sent === "number"
      ? {
          sent: campaignStats.sent,
          replies: campaignStats.replies ?? 0,
          interested: campaignStats.interested ?? 0,
        }
      : null;

  const stats = computeExtendedBookingStats(
    rows.map((row) => ({
      startTime: row.start_time,
      salesCallStatus: row.sales_call_status,
    })),
    outreach,
  );

  const bookingRateLabel = statsLoading && outreach === null
    ? "…"
    : stats.bookingRate === null
      ? String(stats.totalBooked)
      : `${stats.totalBooked} (${formatBookingPercent(stats.bookingRate)})`;

  function formatOutreachMetric(value: number | null): string {
    if (statsLoading && outreach === null) {
      return "…";
    }
    if (value === null) {
      return "—";
    }
    return String(value);
  }

  function formatOutreachPercent(value: number | null): string {
    if (statsLoading && outreach === null) {
      return "…";
    }
    return formatBookingPercent(value);
  }

  return (
    <div className="flex flex-col gap-3">
      {statsError ? (
        <InternalStatusAlert variant="error" message={statsError} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Total booked</p>
            <p className="text-2xl font-semibold tabular-nums">{bookingRateLabel}</p>
            {!campaignLinked && !campaignStats?.linked ? (
              <p className="text-xs text-muted-foreground">
                Lier une campagne dans l&apos;onglet DB pour le booking rate.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatOutreachMetric(stats.sent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Reply %</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatOutreachPercent(stats.replyPercent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Positive %</p>
            <p className="text-2xl font-semibold tabular-nums">
              {formatOutreachPercent(stats.positivePercent)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">No Show</p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.noShowCount}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({formatBookingPercent(stats.noShowPercent)})
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Sur {stats.pastBooked} RDV passés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs text-muted-foreground">Sold</p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.soldCount}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({formatBookingPercent(stats.soldPercent)})
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Sur {stats.pastBooked} RDV passés
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
