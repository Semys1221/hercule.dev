"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { isCalendarConnected, isCalendlyBookingsEnabled } from "@/lib/clients/dashboard-connections";
import type { ClientRow } from "@/lib/clients/types";
import {
  CLIENT_VIDEO_CONFERENCE_OPTIONS,
  parseClientVideoConference,
  videoConferenceLabel,
  type ClientVideoConference,
} from "@/lib/clients/video-conference";

type EventTypeOption = {
  uri: string;
  name: string;
  schedulingUrl: string;
};

type EnginConnectionsDialogProps = {
  client: ClientRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (client: ClientRow) => void;
};

const UNSET_VISIO = "unset";
const NO_EVENT = "none";

export function EnginConnectionsDialog({
  client,
  open,
  onOpenChange,
  onUpdated,
}: EnginConnectionsDialogProps) {
  const [calendarConnected, setCalendarConnected] = React.useState(true);
  const [videoConference, setVideoConference] = React.useState<string>(UNSET_VISIO);
  const [bookingsEnabled, setBookingsEnabled] = React.useState(false);
  const [eventTypeUri, setEventTypeUri] = React.useState(NO_EVENT);
  const [eventTypes, setEventTypes] = React.useState<EventTypeOption[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open || !client) return;
    setCalendarConnected(isCalendarConnected(client.profile));
    setVideoConference(parseClientVideoConference(client.profile) ?? UNSET_VISIO);
    setBookingsEnabled(isCalendlyBookingsEnabled(client.profile));
    setEventTypeUri(client.calendly_event_type_uri?.trim() || NO_EVENT);
  }, [open, client]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingEvents(true);
    void fetch("/api/admin/engin/calendly/event-types")
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
          eventTypes?: EventTypeOption[];
        };
        if (!response.ok) {
          throw new Error(body.error || "Impossible de charger les events Calendly");
        }
        if (!cancelled) setEventTypes(body.eventTypes ?? []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast({
          variant: "destructive",
          title: "Events Calendly indisponibles",
          description: error instanceof Error ? error.message : "Une erreur est survenue.",
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const knownUris = new Set(eventTypes.map((eventType) => eventType.uri));
  const savedUri = client?.calendly_event_type_uri?.trim() || "";
  const options =
    savedUri && !knownUris.has(savedUri)
      ? [
          {
            uri: savedUri,
            name: "Event déjà lié",
            schedulingUrl: client?.calendly_scheduling_url?.trim() || "",
          },
          ...eventTypes,
        ]
      : eventTypes;

  async function handleSubmit() {
    if (!client) return;
    const selected =
      eventTypeUri === NO_EVENT
        ? null
        : options.find((eventType) => eventType.uri === eventTypeUri) ?? null;
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/engin/clients/${encodeURIComponent(client.id)}/connections`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarConnected,
            videoConference:
              videoConference === UNSET_VISIO
                ? null
                : (videoConference as ClientVideoConference),
            calendlyBookingsEnabled: bookingsEnabled,
            calendlyEventTypeUri: selected?.uri ?? null,
            calendlySchedulingUrl: selected
              ? selected.schedulingUrl || client.calendly_scheduling_url
              : client.calendly_event_type_uri
                ? null
                : client.calendly_scheduling_url,
          }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec de la mise à jour",
        );
      }
      onUpdated(body.client as ClientRow);
      toast({ title: "Connexions enregistrées" });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d’enregistrer",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connexions dashboard</DialogTitle>
          <DialogDescription>
            {client
              ? `${client.email} — calendrier, visioconférence et event Calendly.`
              : "Sélectionnez un client"}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="engin-calendar-connected">Calendrier connecté</FieldLabel>
            <Switch
              id="engin-calendar-connected"
              checked={calendarConnected}
              onCheckedChange={setCalendarConnected}
              disabled={submitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="engin-video-conference">Visioconférence</FieldLabel>
            <Select
              value={videoConference}
              onValueChange={setVideoConference}
              disabled={submitting}
            >
              <SelectTrigger id="engin-video-conference" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET_VISIO}>{videoConferenceLabel(null)}</SelectItem>
                {CLIENT_VIDEO_CONFERENCE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {videoConferenceLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="engin-calendly-bookings">Réservations Calendly</FieldLabel>
            <Switch
              id="engin-calendly-bookings"
              checked={bookingsEnabled}
              onCheckedChange={setBookingsEnabled}
              disabled={submitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="engin-calendly-event">Event Calendly</FieldLabel>
            <Select
              value={eventTypeUri}
              onValueChange={setEventTypeUri}
              disabled={submitting || loadingEvents}
            >
              <SelectTrigger id="engin-calendly-event" className="w-full">
                <SelectValue
                  placeholder={loadingEvents ? "Chargement…" : "Choisir un event"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EVENT}>Aucun</SelectItem>
                {options.map((eventType) => (
                  <SelectItem key={eventType.uri} value={eventType.uri}>
                    {eventType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            disabled={submitting || !client}
            onClick={() => void handleSubmit()}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
