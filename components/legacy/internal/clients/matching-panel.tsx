"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClientRow } from "@/app/api/admin/clients/route";

type MatchingPanelProps = {
  entrepriseId: string;
};

export function MatchingPanel({ entrepriseId }: MatchingPanelProps) {
  const [agences, setAgences] = React.useState<ClientRow[]>([]);
  const [agenceId, setAgenceId] = React.useState<string>("");
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/clients?category=agence")
      .then((response) => response.json() as Promise<{ clients: ClientRow[] }>)
      .then((body) => {
        if (!cancelled) setAgences(body.clients ?? []);
      })
      .catch(() => {
        if (!cancelled) setAgences([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    if (!agenceId) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agenceId, entrepriseId }),
      });
      const body = (await response.json()) as { error?: string; matchId?: string };
      if (!response.ok) throw new Error(body.error ?? "Match impossible");
      setMessage("Match envoyé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-56 flex-col gap-2">
      <Select value={agenceId} onValueChange={setAgenceId}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Agence" />
        </SelectTrigger>
        <SelectContent>
          {agences.map((agence) => (
            <SelectItem key={agence.id} value={agence.id}>
              {agence.company ?? agence.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" disabled={!agenceId || pending} onClick={() => void confirm()}>
        {pending ? "Envoi…" : "Confirmer le match"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
