"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { primaryReservationLink } from "@/lib/calendly/enrich-bookings";
import { readBookingsClientCache } from "@/lib/calendly/bookings-client-cache";
import { CALENDLY_BOOKINGS_DAYS_BEHIND } from "@/lib/calendly/bookings-window";
import { fetchEnrichedBookings } from "@/lib/calendly/fetch-enriched-bookings";
import { salesAudienceToLeadCategory } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";
import { setDeveloperModeEnabled, getDeveloperModeEnabledServerSnapshot, getDeveloperModeEnabledSnapshot, subscribeDeveloperModeEnabled } from "@/lib/admin/funnels/sales-funnel-settings";
import {
  SESSION_TEST_MEETING_ACTIVE,
  SESSION_TEST_MEETING_CTA,
  SESSION_RESET_ARIA,
  SESSION_RESET_CTA,
  SESSION_TEST_MEETING_ERROR,
  SESSION_TEST_MEETING_LOADING,
  WELCOME_SCRIPT_TITLE,
} from "@/lib/admin/funnels/ui-copy";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { setDashboardDeveloperModeEnabled } from "@/lib/dashboard/developer-mode";
import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { postBookingLinkFor, reservationEntrepriseLinkFor, resolveSalesSessionDashboardLink } from "@/lib/link-tracking/urls";
import { cn } from "@/lib/utils";

import {
  salesBookingLabel,
  SalesBookingSelectOptions,
  salesBookingValueClassName,
} from "./sales-booking-select-options";
import { SalesIntroChecklist } from "./sales-intro-checklist";
import { SalesScriptContent } from "./sales-script-content";
import {
  buildSalesIntroChecklist,
  getSalesDeclarativeScript,
} from "./sales-intro-script";

const DEFAULT_MEETING_NAME = "No meetings";

type ScriptTab = "intro" | "declarative";

type TestMeetingPreset = {
  qualification: SalesQualificationValues;
  closing: SalesClosingValues;
};

type RendezVousPanelProps = {
  audience: Audience;
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  hasSelectedBooking: boolean;
  sessionResetKey: number;
  onMeetingNameChange: (name: string) => void;
  onBookingSelect: (booking: EnrichedCalendlyBooking | null) => Promise<void>;
  onApplyTestPreset: (preset: TestMeetingPreset) => void;
  onResetSession: () => void;
};

function formatParisDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCacheLabel(fetchedAt: number | null): string | null {
  if (!fetchedAt) {
    return null;
  }
  return `Cache local — ${formatParisDateTime(new Date(fetchedAt).toISOString())}`;
}

function meetingDisplayName(booking: EnrichedCalendlyBooking): string {
  return booking.first_name?.trim() || booking.name.trim() || booking.email;
}

function LinkRow({ label, href }: { label: string; href: string | null | undefined }) {
  if (!href) {
    return (
      <p className="text-sm">
        <span className="text-muted-foreground">{label} :</span> —
      </p>
    );
  }

  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label} :</span>{" "}
      <a href={href} target="_blank" rel="noreferrer" className="break-all underline">
        {href}
      </a>
    </p>
  );
}

function hydrateBookingsFromCache(audience: Audience) {
  const cached = readBookingsClientCache(audience, CALENDLY_BOOKINGS_DAYS_BEHIND);
  return {
    bookings: cached?.bookings ?? [],
    fetchedAt: cached?.fetchedAt ?? null,
  };
}

export function RendezVousPanel({
  audience,
  selectedLead,
  selectedBooking,
  hasSelectedBooking,
  sessionResetKey,
  onMeetingNameChange,
  onBookingSelect,
  onApplyTestPreset,
  onResetSession,
}: RendezVousPanelProps) {
  const [bookings, setBookings] = useState<EnrichedCalendlyBooking[]>(
    () => hydrateBookingsFromCache(audience).bookings,
  );
  const [cacheFetchedAt, setCacheFetchedAt] = useState<number | null>(
    () => hydrateBookingsFromCache(audience).fetchedAt,
  );
  const [selectedUri, setSelectedUri] = useState<string>("");
  const [scriptTab, setScriptTab] = useState<ScriptTab>("intro");
  const [syncing, setSyncing] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testActive, setTestActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const developerModeEnabled = useSyncExternalStore(
    subscribeDeveloperModeEnabled,
    () => getDeveloperModeEnabledSnapshot(audience),
    getDeveloperModeEnabledServerSnapshot,
  );

  const introChecklist = useMemo(
    () =>
      selectedBooking ? buildSalesIntroChecklist(selectedBooking, audience) : null,
    [audience, selectedBooking],
  );

  const cacheLabel = useMemo(() => formatCacheLabel(cacheFetchedAt), [cacheFetchedAt]);

  useEffect(() => {
    if (selectedBooking) {
      onMeetingNameChange(meetingDisplayName(selectedBooking));
      return;
    }
    onMeetingNameChange(DEFAULT_MEETING_NAME);
  }, [selectedBooking, onMeetingNameChange]);

  useEffect(() => {
    const hydrated = hydrateBookingsFromCache(audience);
    setBookings(hydrated.bookings);
    setCacheFetchedAt(hydrated.fetchedAt);
    setSelectedUri("");
    setScriptTab("intro");
    setError(null);
  }, [audience]);

  useEffect(() => {
    setScriptTab("intro");
  }, [sessionResetKey]);

  const syncFromCalendly = useCallback(async () => {
    setSyncing(true);
    setError(null);
    setSelectedUri("");
    setScriptTab("intro");
    await onBookingSelect(null);

    try {
      const { bookings: rows, error: fetchError, fetchedAt } = await fetchEnrichedBookings(
        audience,
        {
          legacyCategory: true,
          fresh: true,
          daysBehind: CALENDLY_BOOKINGS_DAYS_BEHIND,
        },
      );
      if (fetchError) {
        throw new Error(fetchError);
      }

      setBookings(rows);
      setCacheFetchedAt(fetchedAt ?? Date.now());
      if (rows.length === 0) {
        setError("Aucun rendez-vous Calendly sur les 30 derniers jours.");
      }
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Impossible de récupérer les rendez-vous",
      );
    } finally {
      setSyncing(false);
    }
  }, [audience, onBookingSelect]);

  const handleBookingChange = useCallback(
    async (inviteeUri: string) => {
      setSelectedUri(inviteeUri);
      setTestActive(false);
      const booking = bookings.find((row) => row.invitee_uri === inviteeUri) ?? null;
      await onBookingSelect(booking);
    },
    [bookings, onBookingSelect],
  );

  const startTestMeeting = useCallback(async () => {
    setTestLoading(true);
    setError(null);
    setTestActive(false);

    try {
      const response = await fetch("/api/admin/sales-funnel/test-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience }),
      });
      const body = (await response.json()) as {
        booking?: EnrichedCalendlyBooking;
        qualification?: SalesQualificationValues;
        closing?: SalesClosingValues;
        error?: string;
      };

      if (!response.ok || !body.booking || !body.qualification || !body.closing) {
        throw new Error(body.error ?? SESSION_TEST_MEETING_ERROR);
      }

      setDeveloperModeEnabled(audience, true);
      setDashboardDeveloperModeEnabled(true);
      setBookings([body.booking]);
      setCacheFetchedAt(Date.now());
      setSelectedUri(body.booking.invitee_uri);
      setScriptTab("intro");
      await onBookingSelect(body.booking);
      onApplyTestPreset({
        qualification: body.qualification,
        closing: body.closing,
      });
      setTestActive(true);
    } catch (testError) {
      setError(
        testError instanceof Error ? testError.message : SESSION_TEST_MEETING_ERROR,
      );
    } finally {
      setTestLoading(false);
    }
  }, [audience, onApplyTestPreset, onBookingSelect]);

  const dashboardLink = useMemo(
    () =>
      resolveSalesSessionDashboardLink({
        lead: selectedLead,
        bookingDashboardLink: selectedBooking?.links?.dashboard_link,
        bookingSlug: selectedBooking?.slug,
        developerMode: developerModeEnabled,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      }).link,
    [
      developerModeEnabled,
      selectedBooking?.links?.dashboard_link,
      selectedBooking?.slug,
      selectedLead,
    ],
  );
  const leadCategory =
    selectedBooking?.lead_category ??
    selectedBooking?.booking_category ??
    salesAudienceToLeadCategory(audience);
  const reservationLink = useMemo(() => {
    if (selectedLead) {
      if (leadCategory === "entreprise") {
        return reservationEntrepriseLinkFor(selectedLead) || null;
      }
      return selectedLead.reservation_agence_link || null;
    }
    if (!selectedBooking?.links) {
      return null;
    }
    return primaryReservationLink(selectedBooking.links, leadCategory);
  }, [leadCategory, selectedBooking?.links, selectedLead]);

  const confirmationLink = useMemo(() => {
    if (leadCategory === "entreprise") {
      if (selectedLead) {
        return postBookingLinkFor(selectedLead);
      }
      return selectedBooking?.links.confirmation_agence_link ?? null;
    }
    return (
      selectedLead?.confirmation_agence_link ??
      selectedBooking?.links.confirmation_agence_link ??
      null
    );
  }, [leadCategory, selectedBooking?.links.confirmation_agence_link, selectedLead]);

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rendez-vous</h1>
        {cacheLabel ? (
          <p className="text-xs text-muted-foreground">{cacheLabel}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Aucun cache local — synchronisez Calendly une fois pour charger la liste.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void syncFromCalendly()}
          disabled={syncing || testLoading}
        >
          <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          {syncing ? "Synchronisation…" : "Mettre à jour depuis Calendly"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onResetSession}
          disabled={!hasSelectedBooking || syncing || testLoading}
          aria-label={SESSION_RESET_ARIA}
        >
          <RotateCcw className="size-4" />
          {SESSION_RESET_CTA}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void startTestMeeting()}
          disabled={syncing || testLoading}
        >
          {testLoading ? SESSION_TEST_MEETING_LOADING : SESSION_TEST_MEETING_CTA}
        </Button>
        {bookings.length > 0 ? (
          <Select value={selectedUri} onValueChange={(value) => void handleBookingChange(value)}>
            <SelectTrigger className="w-full max-w-xl">
              <SelectValue placeholder="Sélectionner un rendez-vous">
                {selectedBooking ? (
                  <span className={salesBookingValueClassName(selectedBooking.start_time)}>
                    {salesBookingLabel(selectedBooking)}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SalesBookingSelectOptions bookings={bookings} />
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      {testActive ? (
        <InternalStatusAlert variant="success" message={SESSION_TEST_MEETING_ACTIVE} />
      ) : null}

      {selectedBooking && !selectedBooking.lead_matched ? (
        <InternalStatusAlert
          variant="error"
          message={
            selectedBooking.warning ??
            "Aucune fiche CRM associée — le closing ne pourra pas générer le lien dashboard."
          }
        />
      ) : null}

      {selectedBooking ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex h-[28rem] flex-col">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base">Réponses Calendly</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Nom :</span> {selectedBooking.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Email :</span> {selectedBooking.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Date :</span>{" "}
                  {formatParisDateTime(selectedBooking.start_time)}
                </p>
              </div>

              {(selectedLead || selectedBooking.links) ? (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-sm font-medium">Fiche CRM</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Statut :</span>{" "}
                    {selectedLead?.statut ?? selectedBooking.statut ?? "—"}
                  </p>
                  <LinkRow label="Réservation" href={reservationLink} />
                  <LinkRow label="Confirmation" href={confirmationLink} />
                  <LinkRow
                    label="Dashboard"
                    href={dashboardLink ?? selectedBooking.links.dashboard_link}
                  />
                  {!dashboardLink && !selectedBooking.links.dashboard_link ? (
                    <p className="text-xs text-muted-foreground">
                      Lien dashboard disponible après webhook Calendly MEETING_BOOKED.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {Object.keys(selectedBooking.questions).length > 0 ? (
                <dl className="space-y-3 text-sm">
                  {Object.entries(selectedBooking.questions).map(([question, answer]) => (
                    <div key={question} className="space-y-1">
                      <dt className="font-medium text-foreground">{question}</dt>
                      <dd className="text-muted-foreground">{answer || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune réponse au formulaire.</p>
              )}
            </CardContent>
          </Card>

          <Card
            className={cn(
              "flex h-[28rem] flex-col",
              scriptTab === "intro" && "border-0 bg-transparent shadow-none",
            )}
          >
            <CardHeader
              className={cn("shrink-0 space-y-3", scriptTab === "intro" && "px-0")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">{WELCOME_SCRIPT_TITLE}</CardTitle>
                <ButtonGroup>
                  <Button
                    type="button"
                    variant={scriptTab === "intro" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScriptTab("intro")}
                  >
                    Introduction
                  </Button>
                  <Button
                    type="button"
                    variant={scriptTab === "declarative" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setScriptTab("declarative")}
                  >
                    Déclaratif
                  </Button>
                </ButtonGroup>
              </div>
            </CardHeader>
            <CardContent
              className={cn("min-h-0 flex-1 overflow-y-auto", scriptTab === "intro" && "px-0")}
            >
              {scriptTab === "intro" && introChecklist ? (
                <SalesIntroChecklist
                  items={introChecklist}
                  resetKey={`${selectedBooking.invitee_uri}-${sessionResetKey}`}
                />
              ) : null}
              {scriptTab === "declarative" ? (
                <SalesScriptContent text={getSalesDeclarativeScript(audience)} />
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
