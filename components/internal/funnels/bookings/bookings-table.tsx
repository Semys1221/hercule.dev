"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { BookingReminderStatus } from "@/components/internal/funnels/bookings/booking-reminder-status";
import { BookingRowToggles } from "@/components/internal/funnels/bookings/booking-row-toggles";
import { BookingsStatsBar } from "@/components/internal/funnels/bookings/bookings-stats-bar";
import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import {
  buildReminderLines,
  sequenceIsLive,
} from "@/lib/admin/bookings/reminder-status";
import {
  formatWorkflowFeedback,
  type WorkflowAction,
} from "@/lib/admin/bookings/workflow-feedback";
import { Button } from "@/components/ui/button";
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
  onNotPresent,
}: {
  actions: BookingRowActionState;
  pending: boolean;
  pendingNotPresent: boolean;
  onNotPresent: () => void;
}) {
  if (!actions.showNotPresent) {
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
        <DropdownMenuItem onSelect={() => onNotPresent()}>Absent ?</DropdownMenuItem>
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
  const [pendingConfirmInvitee, setPendingConfirmInvitee] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notPresentMessage, setNotPresentMessage] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [jobsByLeadId, setJobsByLeadId] = useState<
    Record<string, BookingEmailJobSummary[]>
  >({});

  const isAgenceScope = audience === "agence";

  const fetchEmailJobs = useCallback(async (bookings: EnrichedCalendlyBooking[]) => {
    const leadIds = [
      ...new Set(
        bookings.map((booking) => booking.lead_id?.trim() ?? "").filter(Boolean),
      ),
    ];

    if (leadIds.length === 0) {
      setJobsByLeadId({});
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/bookings/email-jobs?leadIds=${encodeURIComponent(leadIds.join(","))}`,
      );
      const body = (await response.json()) as {
        jobsByLeadId?: Record<string, BookingEmailJobSummary[]>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Impossible de charger les relances email");
      }
      setJobsByLeadId(body.jobsByLeadId ?? {});
    } catch (fetchError) {
      console.error(
        "[bookings-table] email jobs fetch failed:",
        fetchError instanceof Error ? fetchError.message : fetchError,
      );
      setJobsByLeadId({});
    }
  }, []);

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
        await fetchEmailJobs(bookings);
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
    [audience, fetchEmailJobs, isAgenceScope],
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

  const runResetNoShow = useCallback(async (row: EnrichedCalendlyBooking) => {
    const previousStatus = row.sales_call_status;
    setActionError(null);
    setResetMessage(null);
    setPendingInvitee(row.invitee_uri);
    setRows((current) =>
      current.map((item) =>
        item.invitee_uri === row.invitee_uri
          ? { ...item, sales_call_status: "scheduled" }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/admin/bookings/reset-no-show", {
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
        status?: SalesCallStatus;
        cancelledJobs?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Reset impossible");
      }

      const cancelledJobs = body.cancelledJobs ?? 0;
      const jobsLabel =
        cancelledJobs === 1
          ? "1 email en attente annulé"
          : `${cancelledJobs} emails en attente annulés`;
      setResetMessage(`No-show annulé · ${jobsLabel}`);
      void fetchBookings(false);
    } catch (err) {
      setRows((current) =>
        current.map((item) =>
          item.invitee_uri === row.invitee_uri
            ? { ...item, sales_call_status: previousStatus }
            : item,
        ),
      );
      setActionError(err instanceof Error ? err.message : "Reset impossible");
    } finally {
      setPendingInvitee(null);
    }
  }, [fetchBookings]);

  const handleNoShowChange = useCallback(
    (row: EnrichedCalendlyBooking, checked: boolean) => {
      if (checked) {
        void runWorkflowAction(row, "no_show");
        return;
      }
      void runResetNoShow(row);
    },
    [runResetNoShow, runWorkflowAction],
  );

  const runStartConfirmSequence = useCallback(
    async (row: EnrichedCalendlyBooking) => {
      setActionError(null);
      setConfirmMessage(null);
      setPendingConfirmInvitee(row.invitee_uri);

      try {
        const response = await fetch("/api/admin/bookings/start-confirm-sequence", {
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
          started?: boolean;
          reason?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error ?? body.reason ?? "Séquence impossible");
        }

        setConfirmMessage("Séquence de confirmation démarrée");
        void fetchBookings(false);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Séquence impossible");
      } finally {
        setPendingConfirmInvitee(null);
      }
    },
    [fetchBookings],
  );

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
      {resetMessage ? (
        <InternalStatusAlert variant="success" message={resetMessage} />
      ) : null}
      {confirmMessage ? (
        <InternalStatusAlert variant="success" message={confirmMessage} />
      ) : null}

      {isAgenceScope && sortedRows.length > 0 ? (
        <>
          <BookingsStatsBar rows={sortedRows} />
          <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>RDV</TableHead>
                <TableHead>Statut CRM</TableHead>
                <TableHead>Relances</TableHead>
                <TableHead>Statut</TableHead>
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
                const pendingConfirm = pendingConfirmInvitee === row.invitee_uri;
                const reminderLines = buildReminderLines({
                  scheduledAt: row.start_time,
                  category: row.lead_category ?? "agence",
                  jobs: row.lead_id ? jobsByLeadId[row.lead_id] ?? [] : [],
                });
                const canConfirm = row.lead_matched && !sequenceIsLive(reminderLines);
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
                      </div>
                      {row.warning ? (
                        <p className="mt-1 text-xs text-muted-foreground">{row.warning}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatParisDateTime(row.start_time)}
                    </TableCell>
                    <TableCell className="text-sm">{row.statut ?? "—"}</TableCell>
                    <TableCell>
                      <BookingReminderStatus
                        leadId={row.lead_id}
                        scheduledAt={row.start_time}
                        category={row.lead_category ?? "agence"}
                        jobs={row.lead_id ? jobsByLeadId[row.lead_id] ?? [] : []}
                      />
                    </TableCell>
                    <TableCell className="min-w-[6rem]">
                      <BookingRowToggles
                        inviteeUri={row.invitee_uri}
                        salesCallStatus={row.sales_call_status}
                        pendingNoShow={pending}
                        onNoShowChange={(checked) => handleNoShowChange(row, checked)}
                      />
                    </TableCell>
                    <TableCell className="min-w-[10rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        {canConfirm ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pendingConfirm}
                            onClick={() => void runStartConfirmSequence(row)}
                          >
                            {pendingConfirm ? "…" : "Confirmer"}
                          </Button>
                        ) : null}
                        <BookingRowActionsMenu
                          actions={actions}
                          pending={pending}
                          pendingNotPresent={pendingNotPresent}
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
        </>
      ) : null}
    </div>
  );
}
