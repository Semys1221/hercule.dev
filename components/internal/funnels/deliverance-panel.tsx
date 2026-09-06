"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MatchRow = {
  id: string;
  agence_id: string;
  entreprise_id: string;
  status: string;
  search_started_at: string | null;
};

export function DeliverancePanel() {
  const [matches, setMatches] = React.useState<MatchRow[]>([]);
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    fetch("/api/admin/matching")
      .then((response) => response.json() as Promise<{ matches?: MatchRow[]; error?: string }>)
      .then((body) => {
        if (body.error) throw new Error(body.error);
        setMatches(body.matches ?? []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erreur");
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function run(matchId: string, action: "search_started" | "milestone" | "waitlist") {
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
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Délivrance</CardTitle>
        <CardDescription>
          Actions manuelles sur les matches : lancer la recherche, avancer une étape, file d&apos;attente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun match.</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="text-sm">
                <p className="font-medium">{match.status}</p>
                <p className="text-xs text-muted-foreground">{match.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending !== null}
                  onClick={() => void run(match.id, "search_started")}
                >
                  Lancer la recherche
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending !== null}
                  onClick={() => void run(match.id, "milestone")}
                >
                  Avancer l&apos;étape
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending !== null}
                  onClick={() => void run(match.id, "waitlist")}
                >
                  File d&apos;attente
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
