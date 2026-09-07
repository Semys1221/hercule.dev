"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import {
  formatWorkflowFeedback,
  type WorkflowAction,
} from "@/lib/admin/bookings/workflow-feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bookingRowActionState,
  type BookingRowActionState,
} from "@/lib/calendly/booking-row-actions";
import { CALENDLY_BOOKINGS_DAYS_BEHIND } from "@/lib/calendly/bookings-window";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { fetchEnrichedBookings } from "@/lib/calendly/fetch-enriched-bookings";
import type { Audience } from "@/lib/admin/navigation";
import type { SalesCallStatus } from "@/lib/sales-calls/types";

type BookingsTableProps = {
  audience: Audience;
};

type ChannelStatus = "sent" | "skipped" | "error";

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

function SalesCallStatusBadge({ status }: { status: SalesCallStatus | null }) {
  const { badge } = bookingRowActionState(status);
  if (badge === "PAID") {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">PAID</Badge>;
  }
  if (badge === "NO SHOW") {
    return <Badge variant="secondary">NO SHOW</Badge>;
  }
  if (badge === "NON PAYÉ") {
    return <Badge variant="destructive">NON PAYÉ</Badge>;
  }
  return null;
}

function SalesCallStatusHint({
  salesCallStatus,
  leadStatut,
}: {
  salesCallStatus: SalesCallStatus | null;
  leadStatut: string | null;
}) {
  const { badge } = bookingRowActionState(salesCallStatus);
  if (!badge || leadStatut !== "MEETING_BOOKED") {
    return null;
  }

  const callLabel =
    badge === "NO SHOW" ? "no-show" : badge === "NON PAYÉ" ? "non payé" : "payé";

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Statut appel : {callLabel} (CRM inchangé)
    </p>
  );
}

function BookingRowActionsMenu({
  actions,
  pending,
  pendingNotPresent,
  onWorkflow,
  onNotPresent,
}: {
  actions: BookingRowActionState;
  pending: boolean;
  pendingNotPresent: boolean;
  onWorkflow: (action: WorkflowAction) => void;
  onNotPresent: () => void;
}) {
  const hasActions =
    actions.showNoShow || actions.showNotPaid || actions.showNotPresent;
  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={pending || pendingNotPresent}
          aria-label="Actions"
        >
          <span className="text-base leading-none" aria-hidden="true">…</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.showNoShow ? (
          <DropdownMenuItem onSelect={() => onWorkflow("no_show")}>
            No Show
          </DropdownMenuItem>
        ) : null}
        {actions.showNotPaid ? (
          <DropdownMenuItem onSelect={() => onWorkflow("not_paid")}>
            Non Payé
          </DropdownMenuItem>
        ) : null}
        {actions.showNotPresent ? (
          <DropdownMenuItem onSelect={() => onNotPresent()}>Absent ?</DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatNotPresentFeedback(
  resend: ChannelStatus,
  instantly: ChannelStatus,
  resendError?: string,
): string {
  const parts: string[] = [];
  if (resend === "sent") {
    parts.push("Resend");
  } else if (resend === "error") {
    parts.push(resendError ? `Resend en échec : ${resendError}` : "Resend en échec");
  }

  if (instantly === "sent") {
    parts.push("Instantly");
  } else if (instantly === "skipped") {
    parts.push("Instantly ignoré (pas de campagne)");
  } else if (instantly === "error") {
    parts.push("Instantly en échec");
  }

  const sentCount = [resend, instantly].filter((status) => status === "sent").length;
  if (sentCount === 2) {
    return "Email envoyé (Resend + Instantly)";
  }
  if (sentCount === 1) {
    return `Email envoyé (${parts.filter((part) => !part.includes("échec") && !part.includes("ignoré")).join(" + ")})`;
  }
  return parts.join(" · ");
}

export function BookingsTable({ audience }: BookingsTableProps) {
  const [rows, setRows] = useState<EnrichedCalendlyBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitee, setPendingInvitee] = useState<string | null>(null);
  const [pendingNotPresentInvitee, setPendingNotPresentInvitee] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [notPresentMessage, setNotPresentMessage] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);

  const isAgenceScope = audience === "agence";

  const fetchBookings = useCallback(
    async (fresh = false) => {
      if (!isAgenceScope) {
        setRows([]);
        setError("Le module Bookings est disponible pour l'audience agence uniquement.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { bookings, error: fetchError } = await fetchEnrichedBookings(audience, {
          fresh,
          daysBehind: CALENDLY_BOOKINGS_DAYS_BEHIND,
        });
        if (fetchError) {
          throw new Error(fetchError);
        }

        setRows(bookings);
        if (bookings.length === 0) {
          setError("Aucun rendez-vous Calendly sur les 30 derniers jours.");
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
    },
    [audience, isAgenceScope],
  );

  useEffect(() => {
    void fetchBookings(false);
  }, [fetchBookings]);

  const runWorkflowAction = useCallback(
    async (row: EnrichedCalendlyBooking, status: WorkflowAction) => {
      const previousStatus = row.sales_call_status;
      setActionError(null);
      setWorkflowMessage(null);
      setPendingInvitee(row.invitee_uri);
      setRows((current) =>
        current.map((item) =>
          item.invitee_uri === row.invitee_uri
            ? { ...item, sales_call_status: status }
            : item,
        ),
      );

      try {
        const response = await fetch("/api/admin/bookings/workflow-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteeUri: row.invitee_uri,
            leadId: row.lead_id,
            email: row.email,
            startTime: row.start_time,
            status,
          }),
        });
        const body = (await response.json()) as {
          status?: SalesCallStatus;
          error?: string;
          sequence?: {
            started?: boolean;
            reason?: string;
            dispatched?: boolean;
          };
        };
        if (!response.ok) {
          if (body.sequence) {
            setRows((current) =>
              current.map((item) =>
                item.invitee_uri === row.invitee_uri
                  ? { ...item, sales_call_status: previousStatus }
                  : item,
              ),
            );
            setActionError(formatWorkflowFeedback(status, body.sequence));
            return;
          }
          throw new Error(body.error ?? "Action impossible");
        }
        if (body.status) {
          setRows((current) =>
            current.map((item) =>
              item.invitee_uri === row.invitee_uri
                ? { ...item, sales_call_status: body.status ?? status }
                : item,
            ),
          );
        }
        if (body.sequence) {
          setWorkflowMessage(formatWorkflowFeedback(status, body.sequence));
        }
      } catch (err) {
        setRows((current) =>
          current.map((item) =>
            item.invitee_uri === row.invitee_uri
              ? { ...item, sales_call_status: previousStatus }
              : item,
          ),
        );
        setActionError(err instanceof Error ? err.message : "Action impossible");
      } finally {
        setPendingInvitee(null);
      }
    },
    [],
  );

  const sendNotPresentEmail = useCallback(async (row: EnrichedCalendlyBooking) => {
    setActionError(null);
    setNotPresentMessage(null);
    setPendingNotPresentInvitee(row.invitee_uri);

    try {
      const response = await fetch("/api/admin/bookings/not-present", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeUri: row.invitee_uri,
          leadId: row.lead_id,
          email: row.email,
          startTime: row.start_time,
        }),
      });
      const body = (await response.json()) as {
        resend?: ChannelStatus;
        instantly?: ChannelStatus;
        resendError?: string;
        error?: string;
      };

      if (!response.ok) {
        if (body.resend && body.instantly) {
          setActionError(
            formatNotPresentFeedback(body.resend, body.instantly, body.resendError),
          );
          return;
        }
        throw new Error(body.error ?? "Envoi impossible");
      }

      if (body.resend && body.instantly) {
        setNotPresentMessage(
          formatNotPresentFeedback(body.resend, body.instantly, body.resendError),
        );
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setPendingNotPresentInvitee(null);
    }
  }, []);

  const sortedRows = useMemo(
    () => rows.slice().sort((a, b) => b.start_time.localeCompare(a.start_time)),
    [rows],
  );

  const tableCaption = useMemo(
    () => `${sortedRows.length} rendez-vous`,
    [sortedRows.length],
  );

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            RDV Calendly des 30 derniers jours et à venir.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void fetchBookings(true)}
          disabled={loading || !isAgenceScope}
        >
          {loading ? "Chargement…" : "Rafraîchir"}
        </Button>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}
      {actionError ? <InternalStatusAlert variant="error" message={actionError} /> : null}
      {notPresentMessage ? (
        <InternalStatusAlert variant="success" message={notPresentMessage} />
      ) : null}
      {workflowMessage ? (
        <InternalStatusAlert variant="success" message={workflowMessage} />
      ) : null}

      {isAgenceScope && sortedRows.length > 0 ? (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>RDV</TableHead>
                <TableHead>Statut CRM</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Réservation</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead>Dashboard</TableHead>
                <TableHead>Calendly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => {
                const actions = bookingRowActionState(row.sales_call_status);
                const pending = pendingInvitee === row.invitee_uri;
                const pendingNotPresent = pendingNotPresentInvitee === row.invitee_uri;
                return (
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
                    <TableCell className="min-w-[10rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <SalesCallStatusBadge status={row.sales_call_status} />
                        <BookingRowActionsMenu
                          actions={actions}
                          pending={pending}
                          pendingNotPresent={pendingNotPresent}
                          onWorkflow={(status) => void runWorkflowAction(row, status)}
                          onNotPresent={() => void sendNotPresentEmail(row)}
                        />
                      </div>
                      <SalesCallStatusHint
                        salesCallStatus={row.sales_call_status}
                        leadStatut={row.statut}
                      />
                    </TableCell>
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
                );
              })}
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
