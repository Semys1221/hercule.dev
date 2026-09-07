"use client";

import * as React from "react";

import { deliveranceActionHelp } from "@/lib/admin/clients/action-help";
import type { ClientCockpitData } from "@/lib/admin/clients/types";
import type { DeliveranceAction } from "@/lib/deliverance/orchestrator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CockpitActionHint } from "./cockpit-action-hint";

type CockpitDeliverancePanelProps = {
  data: ClientCockpitData;
  onUpdated: () => Promise<void>;
};

const ACTIONS: DeliveranceAction[] = ["search_started", "milestone", "waitlist"];

export function CockpitDeliverancePanel({ data, onUpdated }: CockpitDeliverancePanelProps) {
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(matchId: string, action: DeliveranceAction) {
    setPending(`${matchId}:${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/deliverance/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Action impossible");
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(null);
    }
  }

  if (data.matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun match pour ce client. Créez une proposition depuis l&apos;onglet Match.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data.matches.map((match) => (
        <Card key={match.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base capitalize">{match.status}</CardTitle>
            <CardDescription className="font-mono text-xs">{match.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ACTIONS.map((action) => {
              const help = deliveranceActionHelp(action);
              return (
                <div
                  key={action}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-3"
                >
                  <CockpitActionHint help={help} />
                  <Button
                    type="button"
                    size="sm"
                    variant={action === "search_started" ? "default" : "outline"}
                    disabled={pending !== null}
                    onClick={() => void run(match.id, action)}
                  >
                    {pending === `${match.id}:${action}` ? "…" : help.buttonLabel}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
