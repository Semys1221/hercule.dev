"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArchitectureDataTable,
  type ColumnDef,
} from "@/components/internal/architecture/architecture-data-table";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Niche } from "@/lib/admin/navigation";
import type {
  CrossNicheVariableWarning,
  EmailVariableStatusRow,
  LeadVariableMismatch,
  VerifyEmailVariablesResult,
} from "@/lib/admin/niches/verify-email-variables";

import { ProvisionDialog } from "./provision-dialog";

type CoverageView = "supabase" | "instantly";

type BookingsVariablesPanelProps = {
  niche: Niche;
  campaignLinked: boolean;
};

function statusBadge(status: EmailVariableStatusRow["status"]) {
  switch (status) {
    case "ok":
      return <Badge variant="default">OK</Badge>;
    case "error":
      return <Badge variant="destructive">Manquant</Badge>;
    case "warning":
      return <Badge variant="secondary">Cross-niche</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}

export function BookingsVariablesPanel({
  niche,
  campaignLinked,
}: BookingsVariablesPanelProps) {
  const [coverageView, setCoverageView] = useState<CoverageView>("supabase");
  const [rows, setRows] = useState<EmailVariableStatusRow[]>([]);
  const [mismatches, setMismatches] = useState<LeadVariableMismatch[]>([]);
  const [crossNicheWarnings, setCrossNicheWarnings] = useState<CrossNicheVariableWarning[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [confirmProvisionOpen, setConfirmProvisionOpen] = useState(false);
  const [verified, setVerified] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/variables/status`);
      const body = (await response.json()) as VerifyEmailVariablesResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement variables impossible");
      }
      setRows(body.rows ?? []);
      setCrossNicheWarnings(body.crossNicheWarnings ?? []);
      setMismatches([]);
      setVerified(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [niche]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const onVerify = useCallback(async () => {
    if (!campaignLinked) {
      setError("Liez une campagne Instantly avant de vérifier.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/variables/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await response.json()) as VerifyEmailVariablesResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Vérification impossible");
      }
      setRows(body.rows ?? []);
      setMismatches(body.mismatches ?? []);
      setCrossNicheWarnings(body.crossNicheWarnings ?? []);
      setVerified(true);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Vérification impossible");
    } finally {
      setVerifying(false);
    }
  }, [campaignLinked, niche]);

  const onProvisionClick = useCallback(() => {
    if (crossNicheWarnings.length > 0) {
      setConfirmProvisionOpen(true);
      return;
    }
    setProvisionOpen(true);
  }, [crossNicheWarnings.length]);

  const columns = useMemo<ColumnDef<EmailVariableStatusRow, unknown>[]>(
    () => [
      {
        accessorKey: "token",
        header: "Variable",
        cell: ({ row }) => (
          <code className="text-xs">{row.original.token}</code>
        ),
      },
      {
        accessorKey: "baseUrlPreview",
        header: "Base URL",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {row.original.baseUrlPreview ?? "—"}
          </span>
        ),
      },
      {
        id: "coverage",
        header: coverageView === "supabase" ? "Supabase" : "Instantly",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {coverageView === "supabase"
              ? row.original.supabaseLabel
              : row.original.instantlyLabel}
          </span>
        ),
      },
      {
        accessorKey: "sequenceSlugs",
        header: "Séquences",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.sequenceSlugs.length > 0
              ? row.original.sequenceSlugs.join(", ")
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => statusBadge(row.original.status),
      },
    ],
    [coverageView],
  );

  const hasErrors = rows.some((row) => row.status === "error") || mismatches.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={coverageView}
          onValueChange={(value) => {
            if (value === "supabase" || value === "instantly") {
              setCoverageView(value);
            }
          }}
        >
          <ToggleGroupItem value="supabase">Supabase</ToggleGroupItem>
          <ToggleGroupItem value="instantly">Instantly</ToggleGroupItem>
        </ToggleGroup>

        <Button
          type="button"
          variant={verified && hasErrors ? "destructive" : "secondary"}
          disabled={verifying || !campaignLinked}
          onClick={() => void onVerify()}
        >
          {verifying ? "Vérification…" : "Vérifier"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!campaignLinked}
          onClick={onProvisionClick}
        >
          Provisionner
        </Button>
      </div>

      {!campaignLinked ? (
        <InternalStatusAlert
          variant="info"
          message="Liez une campagne Instantly ci-dessous pour activer Vérifier et Provisionner."
        />
      ) : null}

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      {verified && hasErrors ? (
        <InternalStatusAlert
          variant="error"
          message={`${mismatches.length} lead(s) avec variables manquantes.`}
        />
      ) : null}

      {verified && !hasErrors && rows.some((row) => row.usedInLiveCopy) ? (
        <InternalStatusAlert variant="success" message="Toutes les variables live sont provisionnées." />
      ) : null}

      {crossNicheWarnings.length > 0 ? (
        <InternalStatusAlert
          variant="info"
          message={crossNicheWarnings.map((warning) => warning.message).join(" ")}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des variables…</p>
      ) : (
        <ArchitectureDataTable columns={columns} data={rows} searchColumn="token" />
      )}

      {verified && mismatches.length > 0 ? (
        <div className="rounded-md border p-3">
          <p className="mb-2 text-sm font-medium">Leads en mismatch</p>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-muted-foreground">
            {mismatches.slice(0, 20).map((mismatch) => (
              <li key={mismatch.email}>
                {mismatch.email}
                {mismatch.missingSupabase.length > 0
                  ? ` — Supabase : ${mismatch.missingSupabase.join(", ")}`
                  : ""}
                {mismatch.missingInstantly.length > 0
                  ? ` — Instantly : ${mismatch.missingInstantly.join(", ")}`
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ProvisionDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        niche={niche}
        rows={rows}
        onProvisioned={() => {
          void loadStatus();
        }}
      />

      <AlertDialog open={confirmProvisionOpen} onOpenChange={setConfirmProvisionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Collision cross-niche détectée</AlertDialogTitle>
            <AlertDialogDescription>
              Certaines variables sont activées sur plusieurs niches. Confirmez le
              provisionnement pour cette niche uniquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmProvisionOpen(false);
                setProvisionOpen(true);
              }}
            >
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
