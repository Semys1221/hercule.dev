"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { fetchEnrichedBookings } from "@/lib/calendly/fetch-enriched-bookings";
import type { Audience } from "@/lib/admin/navigation";

type BookingsTableProps = {
  audience: Audience;
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

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function LinkActions({ href, label }: { href: string | null | undefined; label: string }) {
  if (!href) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button type="button" variant="outline" size="sm" onClick={() => copyText(href)}>
        Copier
      </Button>
      <Button type="button" variant="ghost" size="sm" asChild>
        <a href={href} target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5" />
          <span className="sr-only">{label}</span>
        </a>
      </Button>
    </div>
  );
}

function CalendlyLinkRow({
  label,
  href,
}: {
  label: string;
  href: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-muted-foreground">{label}</span>
      <LinkActions href={href} label={label} />
    </div>
  );
}

export function BookingsTable({ audience }: BookingsTableProps) {
  const [rows, setRows] = useState<EnrichedCalendlyBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAgenceScope = audience === "agence";

  const fetchBookings = useCallback(async () => {
    if (!isAgenceScope) {
      setRows([]);
      setError("Le module Bookings est disponible pour l'audience agence uniquement.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { bookings, error: fetchError } = await fetchEnrichedBookings(audience);
      if (fetchError) {
        throw new Error(fetchError);
      }

      setRows(bookings);
      if (bookings.length === 0) {
        setError("Aucun rendez-vous Calendly à venir.");
      }
    } catch (fetchError) {
      setRows([]);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Impossible de récupérer les rendez-vous",
      );
    } finally {
      setLoading(false);
    }
  }, [audience, isAgenceScope]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  const tableCaption = useMemo(
    () => `${rows.length} rendez-vous`,
    [rows.length],
  );

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            RDV Calendly et liens associés par prospect.
          </p>
        </div>
        <Button type="button" onClick={fetchBookings} disabled={loading || !isAgenceScope}>
          {loading ? "Chargement…" : "Rafraîchir"}
        </Button>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      {isAgenceScope && rows.length > 0 ? (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>RDV</TableHead>
                <TableHead>Statut CRM</TableHead>
                <TableHead>Réservation</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead>Dashboard</TableHead>
                <TableHead>Calendly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.invitee_uri}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <div>
                        <div className="font-medium">
                          {row.first_name || row.name || row.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{row.email}</div>
                      </div>
                      {row.provisioned ? (
                        <Badge variant="secondary" className="text-xs">
                          Provisionné
                        </Badge>
                      ) : null}
                    </div>
                    {row.warning ? (
                      <p className="mt-1 text-xs text-muted-foreground">{row.warning}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatParisDateTime(row.start_time)}
                  </TableCell>
                  <TableCell className="text-sm">{row.statut ?? "—"}</TableCell>
                  <TableCell className="min-w-[7rem]">
                    <LinkActions
                      href={row.links.reservation_agence_link}
                      label="Réservation"
                    />
                  </TableCell>
                  <TableCell className="min-w-[7rem]">
                    <LinkActions
                      href={row.links.confirmation_agence_link}
                      label="Confirmation"
                    />
                  </TableCell>
                  <TableCell className="min-w-[7rem]">
                    <LinkActions href={row.links.dashboard_link} label="Dashboard" />
                  </TableCell>
                  <TableCell className="min-w-[9rem]">
                    <div className="space-y-1 text-xs">
                      <CalendlyLinkRow label="Visio" href={row.links.calendly_join_url} />
                      <CalendlyLinkRow
                        label="Reporter"
                        href={row.links.calendly_reschedule_url}
                      />
                      <CalendlyLinkRow label="Annuler" href={row.links.calendly_cancel_url} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            {tableCaption}
          </p>
        </div>
      ) : null}
    </div>
  );
}
