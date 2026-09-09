"use client";

import * as React from "react";

import { DeliverabilityHealthBadge } from "@/components/internal/deliverability/deliverability-health-badge";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type {
  AccountStateAction,
  DeliverabilityAccountRow,
} from "@/lib/admin/deliverability/types";

const BULK_PAUSE_PHRASE = "PAUSE";

async function runAccountAction(email: string, action: AccountStateAction) {
  const response = await fetch("/api/admin/deliverability/accounts/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, action }),
  });
  const json = (await response.json()) as { ok?: boolean; error?: string };
  if (!response.ok) {
    throw new Error(json.error ?? "Action impossible");
  }
}

function ActionButton({
  label,
  variant = "outline",
  confirmTitle,
  confirmDescription,
  onConfirm,
}: {
  label: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: () => Promise<void>;
}) {
  const [pending, setPending] = React.useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} disabled={pending}>
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (event) => {
              event.preventDefault();
              setPending(true);
              try {
                await onConfirm();
                toast({ title: `${label} — terminé` });
              } catch (error) {
                toast({
                  title: "Erreur",
                  description: error instanceof Error ? error.message : "Action impossible",
                  variant: "destructive",
                });
              } finally {
                setPending(false);
              }
            }}
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeliverabilityControlPanel({
  account,
  filteredAccounts,
  onActionComplete,
}: {
  account: DeliverabilityAccountRow | null;
  filteredAccounts: DeliverabilityAccountRow[];
  onActionComplete: () => void;
}) {
  const [bulkPhrase, setBulkPhrase] = React.useState("");
  const [bulkPending, setBulkPending] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);

  async function handleAction(action: AccountStateAction) {
    if (!account) return;
    await runAccountAction(account.email, action);
    onActionComplete();
  }

  async function handleBulkPause() {
    setBulkError(null);
    if (bulkPhrase.trim() !== BULK_PAUSE_PHRASE) {
      setBulkError(`Tapez ${BULK_PAUSE_PHRASE} pour confirmer.`);
      return;
    }
    const targets = filteredAccounts.filter((row) => row.status === 1);
    if (targets.length === 0) {
      setBulkError("Aucun compte actif dans le filtre courant.");
      return;
    }
    setBulkPending(true);
    try {
      for (const row of targets) {
        await runAccountAction(row.email, "pause");
      }
      toast({ title: `${targets.length} compte(s) mis en pause` });
      onActionComplete();
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Bulk pause impossible");
    } finally {
      setBulkPending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contrôle compte</CardTitle>
          <CardDescription>
            Pause, reprise et warmup pour l&apos;inbox sélectionnée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!account ? (
            <p className="text-sm text-muted-foreground">
              Sélectionnez une inbox dans le tableau pour afficher les actions.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{account.email}</span>
                <DeliverabilityHealthBadge health={account.health} />
                <Badge variant="outline">{account.statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  label="Pause"
                  variant="destructive"
                  confirmTitle="Mettre en pause ?"
                  confirmDescription={`Instantly arrêtera l'envoi pour ${account.email}.`}
                  onConfirm={() => handleAction("pause")}
                />
                <ActionButton
                  label="Reprendre"
                  confirmTitle="Reprendre l'envoi ?"
                  confirmDescription={`Relance l'envoi pour ${account.email}.`}
                  onConfirm={() => handleAction("resume")}
                />
                <ActionButton
                  label="Activer warmup"
                  confirmTitle="Activer le warmup ?"
                  confirmDescription="Lance un job Instantly pour activer le warmup."
                  onConfirm={() => handleAction("enable_warmup")}
                />
                <ActionButton
                  label="Désactiver warmup"
                  confirmTitle="Désactiver le warmup ?"
                  confirmDescription="Lance un job Instantly pour couper le warmup."
                  onConfirm={() => handleAction("disable_warmup")}
                />
                <ActionButton
                  label="Recheck DNS"
                  confirmTitle="Relancer le test DNS ?"
                  confirmDescription="Vérifie MX, SPF, DKIM et DMARC pour ce compte."
                  onConfirm={() => handleAction("test_vitals")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk pause (filtre courant)</CardTitle>
          <CardDescription>
            Met en pause tous les comptes actifs visibles. Action destructive — confirmation
            obligatoire.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {bulkError ? <InternalStatusAlert variant="error" message={bulkError} /> : null}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bulk_pause_phrase">
                Tapez {BULK_PAUSE_PHRASE} pour confirmer
              </FieldLabel>
              <Input
                id="bulk_pause_phrase"
                value={bulkPhrase}
                onChange={(event) => setBulkPhrase(event.target.value)}
                placeholder={BULK_PAUSE_PHRASE}
              />
            </Field>
          </FieldGroup>
          <Button
            type="button"
            variant="destructive"
            disabled={bulkPending}
            onClick={handleBulkPause}
          >
            {bulkPending ? "Pause en cours…" : "Bulk pause comptes actifs"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
