"use client";

import { useEffect, useMemo, useState } from "react";

import { HerculeMark } from "@/components/hercule-mark";
import { StepFaq } from "@/components/legacy/dashboard/steps/step-faq";
import { buildTrackingScript } from "@/lib/clients/tracking/script";
import type { ClientDashboardData } from "@/lib/clients/types";

import { TrackingDatesBanner } from "./tracking-dates-banner";
import { TrackingDossier } from "./tracking-dossier";
import { TrackingLog } from "./tracking-log";
import { TrackingRail } from "./tracking-rail";
import { TrackingAccountManager } from "./tracking-account-manager";
import { TrackingSupportLinks } from "./tracking-support-links";

type TrackingBoardProps = {
  data: ClientDashboardData;
  onRefresh?: () => void;
};

function minuteBucket(time: number): number {
  return Math.floor(time / 60_000) * 60_000;
}

function isRetractionFrozen(data: ClientDashboardData, now: Date): boolean {
  if (!data.retraction || data.retraction.status !== "pending") return false;
  if (!data.retraction.endsAt) return true;
  return new Date(data.retraction.endsAt).getTime() > now.getTime();
}

export function TrackingBoard({ data, onRefresh }: TrackingBoardProps) {
  const [nowMs, setNowMs] = useState(() => minuteBucket(Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(minuteBucket(Date.now()));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const appointmentKey = data.appointments
    .filter((appointment) => appointment.status === "scheduled")
    .map(
      (appointment) =>
        `${appointment.id}|${appointment.scheduledAt ?? ""}|${appointment.inviteeName ?? ""}`,
    )
    .join(",");

  const now = new Date(nowMs);
  const frozen = isRetractionFrozen(data, now);

  const clientLabel =
    data.displayName?.trim() || data.firstName?.trim() || null;

  const script = useMemo(
    () =>
      buildTrackingScript({
        succeededAt: data.succeededAt,
        retraction: data.retraction
          ? {
              activationAt: data.retraction.activationAt,
              status: data.retraction.status,
              endsAt: data.retraction.endsAt,
            }
          : null,
        clientType: data.clientType,
        offerType: data.offerType,
        rdvTotal: data.rdvTotal,
        appointments: data.appointments.filter((appointment) => appointment.status === "scheduled"),
        slug: data.slug,
        now,
        calendarConnected: data.calendarConnected,
      }),
    [
      appointmentKey,
      data.appointments,
      data.calendarConnected,
      data.clientType,
      data.offerType,
      data.rdvTotal,
      data.retraction,
      data.slug,
      data.succeededAt,
      nowMs,
    ],
  );

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--card),transparent)] bg-fixed text-foreground">
      <div className="sticky top-0 z-30 border-b border-border/70 bg-background">
        <header>
          <div className="mx-auto flex min-h-12 max-w-6xl items-center justify-between gap-4 px-6">
            <div className="flex shrink-0 items-center gap-2">
              <HerculeMark className="size-5 text-foreground" />
              <span className="text-sm font-semibold">Hercule</span>
            </div>
            <div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                Dossier <span className="text-foreground">{data.slug}</span>
              </span>
              <span className="hidden sm:inline" aria-hidden>
                ·
              </span>
              <span className="hidden md:inline">
                Volumes :{" "}
                <span className="text-foreground tabular-nums">{data.rdvTotal} RDV</span>
              </span>
              <a
                href={`mailto:${data.contactEmail}`}
                className="text-xs transition-colors hover:text-foreground"
              >
                Aide
              </a>
            </div>
          </div>
        </header>

        <TrackingDatesBanner
          deliveryAt={script.deliveryAt}
          volumeEndAt={script.volumeEndAt}
          rdvTotal={data.rdvTotal}
          frozen={frozen}
        />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Espace client
          </p>
          {clientLabel ? (
            <h1 className="text-2xl font-semibold tracking-tight">{clientLabel}</h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-balance text-tracking">
              {script.heroTitle}
            </h1>
          )}
          {clientLabel ? (
            <p className="text-lg font-medium text-tracking">{script.heroTitle}</p>
          ) : null}
          <p className="text-muted-foreground">{script.heroDetail}</p>
        </div>

        <TrackingRail stations={script.stations} />

        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-10">
            <TrackingLog scans={script.scans} />
            {data.faq.length > 0 ? (
              <div id="client-faq">
                <StepFaq items={data.faq} />
              </div>
            ) : null}
            <footer className="grid gap-8 border-t border-border/40 pt-8 md:grid-cols-2 md:items-start">
              <TrackingSupportLinks
                contactEmail={data.contactEmail}
                upsellUrl={data.upsellUrl}
                showFaqLink={data.faq.length > 0}
              />
              <TrackingAccountManager />
            </footer>
          </div>
          <TrackingDossier data={data} onRefresh={onRefresh} />
        </div>
      </main>
    </div>
  );
}
