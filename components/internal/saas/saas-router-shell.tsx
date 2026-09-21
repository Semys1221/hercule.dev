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

type RouterRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  assigned_count: number;
  skipped_count: number;
  error_count: number;
  details: Record<string, unknown>;
};

export function SaasRouterShell() {
  const [runs, setRuns] = React.useState<RouterRun[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/router");
      const json = (await res.json()) as { runs?: RouterRun[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Load failed");
      setRuns(json.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function triggerDryRun() {
    setBusy(true);
    setError(null);
    try {
      // Admin dry-run via cron endpoint requires CRON_SECRET — use admin-only status for now
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool router — logs</CardTitle>
        <CardDescription>
          Runs horaires du cron `/api/cron/pool-router` (fair-share entre slots
          actifs).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun run enregistré. Configurer cron-job.org sur
            `/api/cron/pool-router`.
          </p>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="flex justify-between gap-2">
                <span>
                  {new Date(run.started_at).toLocaleString("fr-FR")}
                </span>
                <span className="text-muted-foreground">
                  +{run.assigned_count} · skip {run.skipped_count} · err{" "}
                  {run.error_count}
                </span>
              </div>
            </div>
          ))
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Rafraîchir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void triggerDryRun()}
          >
            Recharger
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
