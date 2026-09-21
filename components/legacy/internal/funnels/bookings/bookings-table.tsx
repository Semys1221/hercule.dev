"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { InternalStatusAlert } from "@/components/legacy/internal/funnels/ui/internal-status-alert";
import { BookingEtatCell } from "@/components/legacy/internal/funnels/bookings/booking-etat-cell";
import { BookingReminderStatus } from "@/components/legacy/internal/funnels/bookings/booking-reminder-status";
import {
  BookingRowMenu,
  type BookingLinkItem,
} from "@/components/legacy/internal/funnels/bookings/booking-row-menu";
import { BookingsStatsBar } from "@/components/legacy/internal/funnels/bookings/bookings-stats-bar";
import {
  clearBookingsPageCache,
  formatBookingsCacheAge,
  type BookingsCampaignStats,
} from "@/lib/legacy/admin/bookings/bookings-page-cache";
import type { BookingEmailJobSummary } from "@/lib/legacy/admin/bookings/email-jobs";
import {
  loadBookingsPage,
  patchBookingsPageCache,
} from "@/lib/legacy/admin/bookings/load-bookings-page";
import {
  buildReminderLines,
  sequenceIsLive,
} from "@/lib/legacy/admin/bookings/reminder-status";
import {
  readAllBookingLocalDocs,
  requiresBookingLocalNote,
  writeBookingLocalDoc,
  type BookingLocalDoc,
} from "@/lib/legacy/admin/bookings/booking-local-docs";
import {
  formatWorkflowFeedback,
  type WorkflowAction,
} from "@/lib/legacy/admin/bookings/workflow-feedback";
import { workflowSequencesEnabled } from "@/lib/legacy/admin/bookings/workflow-sequences-enabled";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  bookingRelativeHint,
  formatParisDateTime,
  matchesBookingTimeFilter,
  type BookingTimeFilter,
} from "@/lib/legacy/admin/bookings/booking-rdv-label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bookingRowActionState } from "@/lib/legacy/calendly/booking-row-actions";
import { isCalendlyBookingCanceled } from "@/lib/legacy/calendly/list-bookings";
import { CALENDLY_BOOKINGS_DAYS_BEHIND } from "@/lib/legacy/calendly/bookings-window";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";
import {
  primaryConfirmationLink,
  primaryReservationLink,
} from "@/lib/legacy/calendly/enrich-bookings";
import type { Niche } from "@/lib/legacy/admin/navigation";
import type { SalesCallStatus } from "@/lib/legacy/sales-calls/types";

type BookingsTableProps = {
  niche: Niche;
  connectionsRevision?: number;
  refreshNonce?: number;
};

type WorkflowDialogKind = "no_show" | "not_paid" | "lost" | "unqualified";

type WorkflowDialogState = {
  row: EnrichedCalendlyBooking;
  kind: WorkflowDialogKind;
};

function buildBookingLinks(row: EnrichedCalendlyBooking): BookingLinkItem[] {
  const category = row.lead_category ?? row.booking_category;
  const candidates = [
    {
      label: "Réservation",
      href: primaryReservationLink(row.links, category),
    },
    {
      label: "Confirmation",
      href: primaryConfirmationLink(row.links, category),
    },
    { label: "Dashboard", href: row.links.dashboard_link },
    { label: "Visio", href: row.links.calendly_join_url },
    { label: "Reporter", href: row.links.calendly_reschedule_url },
    { label: "Annuler", href: row.links.calendly_cancel_url },
  ];

  return candidates.flatMap((item) =>
    item.href ? [{ label: item.label, href: item.href }] : [],
  );
}

export function BookingsTable({
  niche,
  connectionsRevision = 0,
  refreshNonce = 0,
}: BookingsTableProps) {
  const [rows, setRows] = useState<EnrichedCalendlyBooking[]>([]);
  const [timeFilter, setTimeFilter] = useState<BookingTimeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheFetchedAt, setCacheFetchedAt] = useState<number | null>(null);
  const [pendingInvitee, setPendingInvitee] = useState<string | null>(null);
  const [pendingConfirmInvitee, setPendingConfirmInvitee] = useState<string | null>(null);
  const [pendingFixAll, setPendingFixAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [fixMessage, setFixMessage] = useState<string | null>(null);
  const [workflowDialog, setWorkflowDialog] = useState<WorkflowDialogState | null>(null);
  const [workflowDialogNote, setWorkflowDialogNote] = useState("");
  const [localDocs, setLocalDocs] = useState<Record<string, BookingLocalDoc>>({});
  const [jobsByLeadId, setJobsByLeadId] = useState<
    Record<string, BookingEmailJobSummary[]>
  >({});

  const [campaignStats, setCampaignStats] = useState<BookingsCampaignStats | null>(null);
  const [campaignLinked, setCampaignLinked] = useState(false);
  const [calendlyConfigured, setCalendlyConfigured] = useState(true);

  useEffect(() => {
    setLocalDocs(readAllBookingLocalDocs());
  }, []);

  const persistRowsToCache = useCallback(
    (nextRows: EnrichedCalendlyBooking[]) => {
      patchBookingsPageCache(niche, CALENDLY_BOOKINGS_DAYS_BEHIND, {
        bookings: nextRows,
      });
    },
    [niche],
  );

  const refreshBookings = useCallback(async (fresh = true) => {
    setLoading(true);
    setError(null);
    try {
      const page = await loadBookingsPage(niche, {
        fresh,
        daysBehind: CALENDLY_BOOKINGS_DAYS_BEHIND,
      });
      setRows(page.bookings);
      setJobsByLeadId(page.jobsByLeadId);
      setCampaignStats(page.campaignStats);
      setCalendlyConfigured(page.calendlyConfigured);
      setCampaignLinked(page.campaignLinked);
      setCacheFetchedAt(page.fetchedAt);

      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8f3f56" },
        body: JSON.stringify({
          sessionId: "8f3f56",
          runId: "post-fix",
          hypothesisId: "A",
          location: "bookings-table.tsx:refreshBookings",
          message: "page data loaded",
          data: {
            niche,
            fromCache: page.fromCache,
            rowsCount: page.bookings.length,
            campaignLinked: page.campaignLinked,
            campaignStatsLinked: page.campaignStats?.linked ?? null,
            campaignStatsSent: page.campaignStats?.sent ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (page.error) {
        setError(page.error);
      } else if (page.bookings.length === 0 && page.calendlyConfigured) {
        setError("Aucun rendez-vous Calendly sur les 30 derniers jours.");
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Impossible de récupérer les rendez-vous",
      );
    } finally {
      setLoading(false);
    }
  }, [niche]);

  useEffect(() => {
    void refreshBookings(false);
  }, [refreshBookings]);

  useEffect(() => {
    if (connectionsRevision > 0) {
      clearBookingsPageCache(niche, CALENDLY_BOOKINGS_DAYS_BEHIND);
      void refreshBookings(true);
    }
  }, [connectionsRevision, niche, refreshBookings]);

  useEffect(() => {
    if (refreshNonce === 0) {
      return;
    }
    void refreshBookings(true);
  }, [refreshNonce, refreshBookings]);

  const runWorkflowAction = useCallback(
    async (
      row: EnrichedCalendlyBooking,
      status: WorkflowAction,
      options?: { startSequence?: boolean; successMessage?: string },
    ) => {
      const previousStatus = row.sales_call_status;
      const startSequence = options?.startSequence ?? true;
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
            startSequence,
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
          setRows((current) => {
            const next = current.map((item) =>
              item.invitee_uri === row.invitee_uri
                ? { ...item, sales_call_status: body.status ?? status }
                : item,
            );
            persistRowsToCache(next);
            return next;
          });
        }
        if (options?.successMessage) {
          setWorkflowMessage(options.successMessage);
        } else if (body.sequence) {
          setWorkflowMessage(formatWorkflowFeedback(status, body.sequence));
        } else if (status === "lost") {
          setWorkflowMessage("Prospect marqué comme perdu");
        } else if (status === "no_show" && !startSequence) {
          setWorkflowMessage("No-show marqué (séquence non lancée)");
        } else if (status === "not_paid" && !startSequence) {
          setWorkflowMessage("Non payé marqué (séquence non lancée)");
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
    [niche],
  );

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
      setRows((current) => {
        persistRowsToCache(current);
        return current;
      });
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
  }, [persistRowsToCache]);

  const openWorkflowDialog = useCallback(
    (row: EnrichedCalendlyBooking, kind: WorkflowDialogKind) => {
      setActionError(null);
      setWorkflowDialogNote(localDocs[row.invitee_uri]?.note ?? "");
      setWorkflowDialog({ row, kind });
    },
    [localDocs],
  );

  const confirmWorkflowDialog = useCallback(
    (startSequence: boolean) => {
      const dialog = workflowDialog;
      if (!dialog) {
        return;
      }

      const note = workflowDialogNote.trim();
      const markedAs =
        dialog.kind === "unqualified" || dialog.kind === "lost" ? "lost" : dialog.kind;

      if (requiresBookingLocalNote(markedAs) && !note) {
        setActionError("Ajoutez une note de documentation avant de confirmer.");
        return;
      }

      if (note) {
        const doc = writeBookingLocalDoc(dialog.row.invitee_uri, {
          note,
          markedAs,
          lostVariant:
            dialog.kind === "unqualified"
              ? "unqualified"
              : dialog.kind === "lost"
                ? "lost"
                : undefined,
        });
        setLocalDocs((current) => ({ ...current, [dialog.row.invitee_uri]: doc }));
      }

      setWorkflowDialog(null);
      setWorkflowDialogNote("");

      if (dialog.kind === "lost" || dialog.kind === "unqualified") {
        void runWorkflowAction(dialog.row, "lost", {
          startSequence: false,
          successMessage:
            dialog.kind === "unqualified"
              ? "Prospect marqué unqualified"
              : "Prospect marqué comme perdu",
        });
        return;
      }

      void runWorkflowAction(dialog.row, dialog.kind, { startSequence });
    },
    [workflowDialog, workflowDialogNote, runWorkflowAction],
  );

  type FixUntrackedResult = {
    ok: boolean;
    created?: boolean;
    leadId?: string;
    leadCategory?: EnrichedCalendlyBooking["lead_category"];
    slug?: string;
    statut?: string;
    links?: EnrichedCalendlyBooking["links"];
    error?: string;
    reason?: string;
  };

  const fixUntrackedBooking = useCallback(
    async (row: EnrichedCalendlyBooking): Promise<FixUntrackedResult> => {
      const response = await fetch("/api/admin/bookings/fix-untracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteeUri: row.invitee_uri,
          email: row.email,
          firstName: row.first_name || row.name || null,
          company: row.company,
          startTime: row.start_time,
          eventUri: row.event_uri,
          bookingCategory: row.booking_category ?? row.lead_category ?? niche,
          slug: row.slug,
          questions: row.questions,
          calendlyJoinUrl: row.calendly_join_url,
          calendlyRescheduleUrl: row.calendly_reschedule_url,
          calendlyCancelUrl: row.calendly_cancel_url,
        }),
      });
      const body = (await response.json()) as FixUntrackedResult;
      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? body.reason ?? "Alignement impossible");
      }
      return body;
    },
    [niche],
  );

  const applyFixResult = useCallback(
    (row: EnrichedCalendlyBooking, body: FixUntrackedResult) => {
      setRows((current) => {
        const next = current.map((item) =>
          item.invitee_uri === row.invitee_uri
            ? {
                ...item,
                lead_id: body.leadId ?? item.lead_id,
                lead_category: body.leadCategory ?? item.lead_category,
                slug: body.slug ?? item.slug,
                statut: (body.statut as EnrichedCalendlyBooking["statut"]) ?? item.statut,
                links: body.links ?? item.links,
                lead_matched: true,
                warning: null,
              }
            : item,
        );
        persistRowsToCache(next);
        return next;
      });
    },
    [persistRowsToCache],
  );

  const runFixAllUntracked = useCallback(async () => {
    const targets = rows.filter((row) => !row.lead_matched);
    if (targets.length === 0) {
      return;
    }

    setActionError(null);
    setFixMessage(null);
    setPendingFixAll(true);

    let aligned = 0;
    let created = 0;

    try {
      for (const row of targets) {
        const body = await fixUntrackedBooking(row);
        applyFixResult(row, body);
        aligned += 1;
        if (body.created) {
          created += 1;
        }
      }

      const createdLabel =
        created > 0 ? ` (${created} créé${created > 1 ? "s" : ""})` : "";
      setFixMessage(
        `${aligned} lead${aligned > 1 ? "s" : ""} aligné${aligned > 1 ? "s" : ""}${createdLabel}`,
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Alignement impossible");
    } finally {
      setPendingFixAll(false);
    }
  }, [applyFixResult, fixUntrackedBooking, rows]);

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
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Séquence impossible");
      } finally {
        setPendingConfirmInvitee(null);
      }
    },
    [],
  );

  const sortedRows = useMemo(
    () => rows.slice().sort((a, b) => b.start_time.localeCompare(a.start_time)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sortedRows.filter((row) => {
      if (!matchesBookingTimeFilter(row.start_time, timeFilter)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        row.first_name,
        row.name,
        row.email,
        row.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery, sortedRows, timeFilter]);

  const tableCaption = useMemo(() => {
    if (filteredRows.length === sortedRows.length) {
      return `${filteredRows.length} rendez-vous`;
    }
    return `${filteredRows.length} sur ${sortedRows.length} rendez-vous`;
  }, [filteredRows.length, sortedRows.length]);

  const cacheHint = useMemo(() => {
    if (cacheFetchedAt) {
      const age = formatBookingsCacheAge(cacheFetchedAt);
      const suffix = loading ? " · actualisation…" : " · ↻ pour mettre à jour";
      return `Données en cache ${age}${suffix}`;
    }
    return "Aucune donnée en cache — cliquez sur ↻ pour charger le pipeline.";
  }, [cacheFetchedAt, loading]);

  const untrackedCount = useMemo(
    () => rows.filter((row) => !row.lead_matched).length,
    [rows],
  );

  const sequencesEnabled = workflowSequencesEnabled(niche);

  const workflowDialogIsLostKind =
    workflowDialog?.kind === "lost" || workflowDialog?.kind === "unqualified";

  const workflowDialogRequiresNote =
    workflowDialog?.kind === "not_paid" ||
    workflowDialog?.kind === "lost" ||
    workflowDialog?.kind === "unqualified";

  const workflowDialogTitle = (() => {
    switch (workflowDialog?.kind) {
      case "not_paid":
        return "Marquer ce prospect en non payé ?";
      case "lost":
        return "Marquer ce prospect comme perdu ?";
      case "unqualified":
        return "Marquer ce prospect comme unqualified ?";
      default:
        return "Marquer ce prospect en no-show ?";
    }
  })();

  const workflowDialogDescription = (() => {
    if (!workflowDialog) {
      return null;
    }
    const name =
      workflowDialog.row.first_name ||
      workflowDialog.row.name ||
      workflowDialog.row.email;

    switch (workflowDialog.kind) {
      case "not_paid":
        return `${name} sera marqué non payé. Ajoutez une note de documentation, puis choisissez si vous lancez la séquence close indécis.`;
      case "lost":
        return `${name} sera marqué perdu (sans séquence). La note reste en local sur cet appareil.`;
      case "unqualified":
        return `${name} sera marqué unqualified en interface (statut lost en base). Ajoutez une note de documentation locale.`;
      default:
        return `${name} sera marqué absent. Vous pouvez ajouter une note locale, puis lancer la séquence no-show si besoin.`;
    }
  })();

  return (
    <div className="flex min-w-0 flex-col gap-4 text-left">
      <AlertDialog
        open={workflowDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWorkflowDialog(null);
            setWorkflowDialogNote("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{workflowDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{workflowDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <Label htmlFor="booking-workflow-note">
              Note de documentation
              {workflowDialogRequiresNote ? " (obligatoire)" : " (optionnelle)"}
            </Label>
            <Textarea
              id="booking-workflow-note"
              value={workflowDialogNote}
              onChange={(event) => setWorkflowDialogNote(event.target.value)}
              placeholder="Contexte, raison du statut, prochaine action…"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Stockée localement dans ce navigateur — non synchronisée avec Supabase.
            </p>
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
            {workflowDialogIsLostKind ? (
              <AlertDialogAction
                className="w-full sm:w-full"
                onClick={() => confirmWorkflowDialog(false)}
              >
                Marquer
              </AlertDialogAction>
            ) : (
              <>
                {sequencesEnabled ? (
                  <AlertDialogAction
                    className="w-full sm:w-full"
                    onClick={() => confirmWorkflowDialog(true)}
                  >
                    Marquer et lancer la séquence
                  </AlertDialogAction>
                ) : null}
                <Button
                  type="button"
                  variant={sequencesEnabled ? "outline" : "default"}
                  className="w-full sm:w-full"
                  onClick={() => confirmWorkflowDialog(false)}
                >
                  Marquer seulement
                </Button>
              </>
            )}
            <AlertDialogCancel className="w-full sm:w-full">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}
      {actionError ? <InternalStatusAlert variant="error" message={actionError} /> : null}
      {workflowMessage ? (
        <InternalStatusAlert variant="success" message={workflowMessage} />
      ) : null}
      {resetMessage ? (
        <InternalStatusAlert variant="success" message={resetMessage} />
      ) : null}
      {confirmMessage ? (
        <InternalStatusAlert variant="success" message={confirmMessage} />
      ) : null}
      {fixMessage ? <InternalStatusAlert variant="success" message={fixMessage} /> : null}

      {!calendlyConfigured ? (
        <InternalStatusAlert
          variant="error"
          message={
            niche === "comptable"
              ? "Event Calendly comptable non configuré — sélectionnez l'event via Connexions ou CALENDLY_EVENT_TYPE_URI_COMPTABLE."
              : `Event Calendly ${niche} non configuré — sélectionnez l'event via Connexions.`
          }
        />
      ) : null}

      {calendlyConfigured ? (
        <BookingsStatsBar
          rows={sortedRows}
          campaignLinked={campaignLinked}
          campaignStats={campaignStats}
          statsLoading={loading}
        />
      ) : null}

      {sortedRows.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={timeFilter}
                  onValueChange={(value) => {
                    if (value) {
                      setTimeFilter(value as BookingTimeFilter);
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="upcoming">À venir</ToggleGroupItem>
                  <ToggleGroupItem value="past">Passés</ToggleGroupItem>
                  <ToggleGroupItem value="all">Tous</ToggleGroupItem>
                </ToggleGroup>
                {untrackedCount > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingFixAll || loading}
                    onClick={() => void runFixAllUntracked()}
                  >
                    {pendingFixAll
                      ? `Alignement… (${untrackedCount})`
                      : `Fix all (${untrackedCount})`}
                  </Button>
                ) : null}
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">{cacheHint}</p>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Rechercher un prospect…"
                  className="pl-8"
                  aria-label="Rechercher un prospect"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground sm:hidden">{cacheHint}</p>
          </div>

          <div className="min-w-0 overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prospect</TableHead>
                <TableHead>RDV</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Relances</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun rendez-vous pour ce filtre.
                  </TableCell>
                </TableRow>
              ) : null}
              {filteredRows.map((row) => {
                const actions = bookingRowActionState(row.sales_call_status);
                const pending = pendingInvitee === row.invitee_uri;
                const pendingConfirm = pendingConfirmInvitee === row.invitee_uri;
                const reminderLines = buildReminderLines({
                  scheduledAt: row.start_time,
                  category: row.lead_category ?? "agence",
                  jobs: row.lead_id ? jobsByLeadId[row.lead_id] ?? [] : [],
                });
                const canConfirm = row.lead_matched && !sequenceIsLive(reminderLines);
                const bookingLinks = buildBookingLinks(row);
                const relativeHint = bookingRelativeHint(row.start_time);

                return (
                  <TableRow key={row.invitee_uri}>
                    <TableCell className="max-w-[14rem] whitespace-normal">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {row.first_name || row.name || row.email}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {row.email}
                        </div>
                      </div>
                      {row.warning ? (
                        <p className="mt-1 text-xs text-muted-foreground">{row.warning}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-normal text-sm">
                      <div>{formatParisDateTime(row.start_time)}</div>
                      {relativeHint ? (
                        <div className="text-xs text-muted-foreground">{relativeHint}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <BookingEtatCell
                        statut={row.statut}
                        salesCallStatus={row.sales_call_status}
                        localDoc={localDocs[row.invitee_uri] ?? null}
                        calendlyCanceled={isCalendlyBookingCanceled(row)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <BookingReminderStatus
                        leadId={row.lead_id}
                        scheduledAt={row.start_time}
                        category={row.lead_category ?? "agence"}
                        jobs={row.lead_id ? jobsByLeadId[row.lead_id] ?? [] : []}
                      />
                    </TableCell>
                    <TableCell>
                      <BookingRowMenu
                        niche={niche}
                        links={bookingLinks}
                        actions={actions}
                        leadMatched={row.lead_matched}
                        canConfirm={canConfirm}
                        pending={pending || pendingFixAll}
                        pendingConfirm={pendingConfirm}
                        onConfirm={() => void runStartConfirmSequence(row)}
                        onMarkNotPaid={() => openWorkflowDialog(row, "not_paid")}
                        onMarkNoShow={() => openWorkflowDialog(row, "no_show")}
                        onMarkLost={() => openWorkflowDialog(row, "lost")}
                        onMarkUnqualified={() => openWorkflowDialog(row, "unqualified")}
                        onResetNoShow={() => void runResetNoShow(row)}
                      />
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
