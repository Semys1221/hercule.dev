"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { fetchEnrichedBookings } from "@/lib/calendly/fetch-enriched-bookings";
import type { Audience } from "@/lib/admin/navigation";
import { WELCOME_SCRIPT_TITLE } from "@/lib/admin/funnels/ui-copy";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { dashboardLinkFor } from "@/lib/link-tracking/urls";

import { SalesScriptContent } from "./sales-script-content";
import {
  buildSalesIntroScript,
  SALES_DECLARATIVE_SCRIPT,
} from "./sales-intro-script";

const DEFAULT_MEETING_NAME = "No meetings";

type ScriptTab = "intro" | "declarative";

type RendezVousPanelProps = {
  audience: Audience;
  selectedLead: LinkTrackingLead | null;
  onMeetingNameChange: (name: string) => void;
  onBookingSelect: (booking: EnrichedCalendlyBooking | null) => Promise<void>;
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

function bookingLabel(booking: EnrichedCalendlyBooking): string {
  const name = booking.first_name || booking.name || booking.email;
  return `${name} — ${booking.email} — RDV ${formatParisDateTime(booking.start_time)}`;
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

export function RendezVousPanel({
  audience,
  selectedLead,
  onMeetingNameChange,
  onBookingSelect,
}: RendezVousPanelProps) {
  const [bookings, setBookings] = useState<EnrichedCalendlyBooking[]>([]);
  const [selectedUri, setSelectedUri] = useState<string>("");
  const [scriptTab, setScriptTab] = useState<ScriptTab>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.invitee_uri === selectedUri) ?? null,
    [bookings, selectedUri],
  );

  const introScript = useMemo(
    () => (selectedBooking ? buildSalesIntroScript(selectedBooking) : null),
    [selectedBooking],
  );

  useEffect(() => {
    if (selectedBooking) {
      onMeetingNameChange(meetingDisplayName(selectedBooking));
      return;
    }
    onMeetingNameChange(DEFAULT_MEETING_NAME);
  }, [selectedBooking, onMeetingNameChange]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedUri("");
    setScriptTab("intro");
    await onBookingSelect(null);

    try {
      const { bookings: rows, error: fetchError } = await fetchEnrichedBookings(audience);
      if (fetchError) {
        throw new Error(fetchError);
      }

      setBookings(rows);
      if (rows.length === 0) {
        setError("Aucun rendez-vous Calendly à venir pour cette audience.");
      }
    } catch (fetchError) {
      setBookings([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Impossible de récupérer les rendez-vous",
      );
    } finally {
      setLoading(false);
    }
  }, [audience, onBookingSelect]);

  const handleBookingChange = useCallback(
    async (inviteeUri: string) => {
      setSelectedUri(inviteeUri);
      const booking = bookings.find((row) => row.invitee_uri === inviteeUri) ?? null;
      await onBookingSelect(booking);
    },
    [bookings, onBookingSelect],
  );

  const activeScript =
    scriptTab === "intro" ? introScript : SALES_DECLARATIVE_SCRIPT;

  const dashboardLink = selectedLead ? dashboardLinkFor(selectedLead) : null;

  return (
    <div className="space-y-6 text-left">
      <h1 className="text-2xl font-semibold tracking-tight">Rendez-vous</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={fetchBookings} disabled={loading}>
          {loading ? "Chargement…" : "Récupérer les rendez-vous"}
        </Button>
        {bookings.length > 0 ? (
          <Select value={selectedUri} onValueChange={(value) => void handleBookingChange(value)}>
            <SelectTrigger className="w-full max-w-xl">
              <SelectValue placeholder="Sélectionner un rendez-vous" />
            </SelectTrigger>
            <SelectContent>
              {bookings.map((booking) => (
                <SelectItem key={booking.invitee_uri} value={booking.invitee_uri}>
                  {bookingLabel(booking)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

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
                  <LinkRow
                    label="Réservation"
                    href={
                      selectedLead?.reservation_agence_link ??
                      selectedBooking.links.reservation_agence_link
                    }
                  />
                  <LinkRow
                    label="Confirmation"
                    href={
                      selectedLead?.confirmation_agence_link ??
                      selectedBooking.links.confirmation_agence_link
                    }
                  />
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

          <Card className="flex h-[28rem] flex-col">
            <CardHeader className="shrink-0 space-y-3">
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
            <CardContent className="min-h-0 flex-1 overflow-y-auto">
              {activeScript ? <SalesScriptContent text={activeScript} /> : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
