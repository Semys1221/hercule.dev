"use client";

import { ExternalLink, Mail, RefreshCw, Send } from "lucide-react";
import * as React from "react";

import type { ColumnDef } from "@/components/internal/architecture/architecture-data-table";
import { ArchitectureDataTable } from "@/components/internal/architecture/architecture-data-table";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/hooks/use-toast";
import {
  isModalitesCabinetAudience,
  modalitesAskBody,
  modalitesFormulas,
  MODALITES_SUBJECT,
  SEND_ALL_CONFIRM_PHRASE,
} from "@/lib/modalites-campaign/copy";
import type {
  ModalitesCandidate,
  ModalitesPreview,
  ModalitesSkipped,
} from "@/lib/modalites-campaign/types";
import type { LeadCategory } from "@/lib/link-tracking/types";

type AudienceFilter = "all" | LeadCategory;

type CampaignResponse = {
  ok?: boolean;
  error?: string;
  sent?: number;
  skippedAlreadySent?: number;
  errors?: Array<{ leadId: string; error: string }>;
  preview?: ModalitesPreview;
  eligible?: ModalitesCandidate[];
  skipped?: ModalitesSkipped[];
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

function audienceLabel(category: LeadCategory): string {
  return isModalitesCabinetAudience(category) ? "Cabinet" : "Agence";
}

function jobBadge(status: ModalitesCandidate["askStatus"]) {
  if (!status) {
    return <Badge variant="outline">non envoyé</Badge>;
  }
  const variant =
    status === "sent"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

async function postCampaign(body: {
  mode: "dry_run" | "test_send" | "send_one" | "send_all";
  leadId?: string;
  testTo?: string;
  confirmPhrase?: string;
}): Promise<CampaignResponse> {
  const response = await fetch("/api/admin/modalites-campaign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as CampaignResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Requête impossible");
  }
  return payload;
}

function CopyCard({
  audience,
  title,
}: {
  audience: LeadCategory;
  title: string;
}) {
  const formulas = modalitesFormulas(audience);
  const body = modalitesAskBody(audience);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Objet : {MODALITES_SUBJECT}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {formulas.map((formula) => (
            <div key={formula.name} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {formula.name}
                {formula.recommended ? " — recommandé" : ""}
              </p>
              <p className="text-sm text-muted-foreground">{formula.detail}</p>
            </div>
          ))}
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          {body}
        </pre>
      </CardContent>
    </Card>
  );
}

export function ModalitesCampaignShell() {
  const [filter, setFilter] = React.useState<AudienceFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [acting, setActing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [eligible, setEligible] = React.useState<ModalitesCandidate[]>([]);
  const [skipped, setSkipped] = React.useState<ModalitesSkipped[]>([]);
  const [testTo, setTestTo] = React.useState("");
  const [confirmPhrase, setConfirmPhrase] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ModalitesPreview | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const applyPayload = React.useCallback((payload: CampaignResponse) => {
    setEligible(payload.eligible ?? []);
    setSkipped(payload.skipped ?? []);
    if (payload.preview) {
      setPreview(payload.preview);
    }
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/modalites-campaign");
      const payload = (await response.json()) as CampaignResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Chargement impossible");
      }
      applyPayload(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const rows = React.useMemo(
    () =>
      filter === "all"
        ? eligible
        : eligible.filter((row) =>
            filter === "agence"
              ? row.leadCategory === "agence"
              : isModalitesCabinetAudience(row.leadCategory),
          ),
    [eligible, filter],
  );

  const selected = rows.find((row) => row.leadId === selectedId) ?? rows[0];

  async function runAction(
    mode: "test_send" | "send_one" | "send_all" | "dry_run",
    leadId?: string,
  ) {
    setActing(true);
    setError(null);
    try {
      const payload = await postCampaign({
        mode,
        leadId,
        testTo: testTo.trim() || undefined,
        confirmPhrase: confirmPhrase.trim() || undefined,
      });
      applyPayload(payload);
      if (mode === "dry_run" && payload.preview) {
        setPreviewOpen(true);
      }
      if (mode !== "dry_run") {
        toast({
          title: "Campagne",
          description: `${payload.sent ?? 0} envoi(s), ${payload.skippedAlreadySent ?? 0} déjà traités.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action impossible";
      setError(message);
      toast({ variant: "destructive", title: "Échec", description: message });
    } finally {
      setActing(false);
    }
  }

  const columns = React.useMemo<ColumnDef<ModalitesCandidate, unknown>[]>(
    () => [
      {
        accessorKey: "leadCategory",
        header: "Audience",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {audienceLabel(row.original.leadCategory)}
          </Badge>
        ),
      },
      {
        accessorKey: "email",
        header: "Prospect",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.name || row.original.email}
            </span>
            <span className="text-muted-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "scheduledAt",
        header: "RDV",
        cell: ({ row }) => formatParisDateTime(row.original.scheduledAt),
      },
      {
        accessorKey: "askStatus",
        header: "Mail",
        cell: ({ row }) => jobBadge(row.original.askStatus),
      },
      {
        accessorKey: "cancelStatus",
        header: "Rappel H-3",
        cell: ({ row }) => jobBadge(row.original.cancelStatus),
      },
      {
        accessorKey: "enforceStatus",
        header: "Cancel H-1",
        cell: ({ row }) => jobBadge(row.original.enforceStatus),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={acting}
              onClick={() => {
                setSelectedId(row.original.leadId);
                void runAction("dry_run", row.original.leadId);
              }}
            >
              Aperçu
            </Button>
            {row.original.confirmUrl ? (
              <Button type="button" variant="ghost" size="sm" asChild>
                <a
                  href={row.original.confirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink data-icon="inline-start" />
                  Page
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={acting}
              onClick={() => {
                setSelectedId(row.original.leadId);
                void runAction("send_one", row.original.leadId);
              }}
            >
              Envoyer
            </Button>
          </div>
        ),
      },
    ],
    [acting],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <CopyCard audience="agence" title="Copy agences" />
        <CopyCard audience="entreprise" title="Copy cabinets comptables" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Envoi</CardTitle>
          <CardDescription>
            Dry-run sans envoi. Test Resend sans jobs planifiés. Envoi réel : mail 1
            immédiat, rappel H-3, annulation Calendly silencieuse H-1.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="modalites-test-to">Email de test</FieldLabel>
              <Input
                id="modalites-test-to"
                type="email"
                placeholder="vous@hercule.dev"
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading || acting}
              onClick={() => void load()}
            >
              {loading ? <Spinner data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
              Rafraîchir
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={acting || !selected}
              onClick={() => void runAction("test_send", selected?.leadId)}
            >
              {acting ? <Spinner data-icon="inline-start" /> : <Mail data-icon="inline-start" />}
              Envoi test
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={acting || rows.length === 0}>
                  <Send data-icon="inline-start" />
                  Envoyer à tous ({rows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Envoyer les modalités à tous les RDV pending ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {eligible.length} lead(s) éligibles. Sans confirmation, rappel H-3
                    puis annulation Calendly H-1. Tapez {SEND_ALL_CONFIRM_PHRASE} pour confirmer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Field>
                  <FieldLabel htmlFor="modalites-confirm-phrase">Confirmation</FieldLabel>
                  <Input
                    id="modalites-confirm-phrase"
                    value={confirmPhrase}
                    onChange={(event) => setConfirmPhrase(event.target.value)}
                    placeholder={SEND_ALL_CONFIRM_PHRASE}
                  />
                </Field>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={confirmPhrase !== SEND_ALL_CONFIRM_PHRASE || acting}
                    onClick={() => void runAction("send_all")}
                  >
                    Envoyer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => value && setFilter(value as AudienceFilter)}
          variant="outline"
        >
          <ToggleGroupItem value="all">Tous ({eligible.length})</ToggleGroupItem>
          <ToggleGroupItem value="agence">
            Agences ({eligible.filter((row) => row.leadCategory === "agence").length})
          </ToggleGroupItem>
          <ToggleGroupItem value="entreprise">
            Cabinets ({eligible.filter((row) => isModalitesCabinetAudience(row.leadCategory)).length})
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-sm text-muted-foreground">
          {skipped.length} RDV exclus (trop tôt, déjà confirmés, sans lead, etc.)
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Chargement des rendez-vous Calendly…
        </div>
      ) : rows.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Aucun RDV pending éligible</EmptyTitle>
            <EmptyDescription>
              Les rendez-vous dans moins de 2 heures, déjà confirmés ou sans lead CRM
              sont exclus.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ArchitectureDataTable
          columns={columns}
          data={rows}
          searchColumn="email"
          searchPlaceholder="Rechercher un email…"
          getRowId={(row) => row.leadId}
          selectedRowId={selectedId}
          onRowClick={(row) => setSelectedId(row.leadId)}
        />
      )}

      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Aperçu email</SheetTitle>
            <SheetDescription>
              {preview?.subject ?? MODALITES_SUBJECT}
            </SheetDescription>
          </SheetHeader>
          {preview?.html ? (
            <iframe
              title="Aperçu HTML"
              className="min-h-96 flex-1 border-0 bg-background"
              srcDoc={preview.html}
            />
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap px-4 text-sm text-muted-foreground">
              {preview?.text ?? "Aucun aperçu"}
            </pre>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
