"use client";

import { useCallback, useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Niche } from "@/lib/admin/navigation";
import type { EmailVariableStatusRow } from "@/lib/admin/niches/verify-email-variables";

type ProvisionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niche: Niche;
  rows: EmailVariableStatusRow[];
  onProvisioned?: () => void;
};

type ProvisionResult = {
  patched: number;
  failed: number;
  created: number;
  updated: number;
  selected: number;
  totalInList: number;
  errors: string[];
};

export function ProvisionDialog({
  open,
  onOpenChange,
  niche,
  rows,
  onProvisioned,
}: ProvisionDialogProps) {
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const boundRows = rows.filter((row) => row.usedInLiveCopy || row.baseUrlPreview);

  useEffect(() => {
    if (open) {
      setError(null);
      setResult(null);
    }
  }, [open]);

  const onConfirm = useCallback(async () => {
    setProvisioning(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/admin/niches/${niche}/variables/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resyncAll: false }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        result?: ProvisionResult;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Provision impossible");
      }
      setResult(body.result ?? null);
      onProvisioned?.();
    } catch (provisionError) {
      setError(
        provisionError instanceof Error ? provisionError.message : "Provision impossible",
      );
    } finally {
      setProvisioning(false);
    }
  }, [niche, onProvisioned]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Provisionner Instantly</DialogTitle>
          <DialogDescription>
            PATCH des custom_variables depuis les colonnes Supabase pour les leads de la
            campagne liée. Aucune nouvelle clé ne sera créée.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md border p-3">
          {boundRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune variable bound à afficher.</p>
          ) : (
            boundRows.map((row) => (
              <div key={row.key} className="flex flex-col gap-0.5 text-sm">
                <code className="font-mono text-xs">{row.token}</code>
                {row.baseUrlPreview ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {row.baseUrlPreview}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>

        {error ? <InternalStatusAlert variant="error" message={error} /> : null}
        {result ? (
          <InternalStatusAlert
            variant={result.failed > 0 ? "info" : "success"}
            message={`Instantly : ${result.patched} patchés, ${result.failed} échecs, ${result.created} créés, ${result.updated} mis à jour (${result.selected}/${result.totalInList} leads).`}
          />
        ) : null}
        {result?.errors?.length ? (
          <ul className="max-h-24 overflow-y-auto text-xs text-muted-foreground">
            {result.errors.slice(0, 5).map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={provisioning}>
            {provisioning ? "Provision…" : "Confirmer le provisionnement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
