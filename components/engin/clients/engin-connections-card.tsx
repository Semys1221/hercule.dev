"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  isCalendlyBookingsEnabled,
  isClientCalendarConnected,
} from "@/lib/clients/dashboard-connections";
import type { ClientCalendlySeat, ClientRow } from "@/lib/clients/types";
import {
  CLIENT_VIDEO_CONFERENCE_OPTIONS,
  parseClientVideoConference,
  videoConferenceLabel,
  type ClientVideoConference,
} from "@/lib/clients/video-conference";

const UNSET_VISIO = "unset";

type EnginConnectionsCardProps = {
  client: ClientRow;
  calendlySeat: ClientCalendlySeat | null;
  onUpdated: (client: ClientRow) => void;
};

export function EnginConnectionsCard({
  client,
  calendlySeat,
  onUpdated,
}: EnginConnectionsCardProps) {
  const [calendarConnected, setCalendarConnected] = React.useState(false);
  const [videoConference, setVideoConference] = React.useState<string>(UNSET_VISIO);
  const [bookingsEnabled, setBookingsEnabled] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setCalendarConnected(
      isClientCalendarConnected({ profile: client.profile, calendlySeat }),
    );
    setVideoConference(parseClientVideoConference(client.profile) ?? UNSET_VISIO);
    setBookingsEnabled(isCalendlyBookingsEnabled(client.profile));
  }, [client, calendlySeat]);

  async function handleSubmit() {
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
          }),
        },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Échec de la mise à jour");
      }
      const body = (await response.json()) as { client: ClientRow };
      onUpdated(body.client);
      toast({ title: "Connexions enregistrées" });
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
    <Card>
      <CardHeader>
        <CardTitle>Connexions dashboard</CardTitle>
        <CardDescription>
          Calendrier, visioconférence et réservations. Le lien Calendly se confirme dans
          l’onglet Calendly.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
        </FieldGroup>
        <Button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
