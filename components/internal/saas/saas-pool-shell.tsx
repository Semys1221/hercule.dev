"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SAAS_CAPACITY, type SaasNiche } from "@/lib/capacity/constants";

type PoolResponse = {
  available: Record<SaasNiche, number>;
  statusCounts: Record<string, number>;
  alertThreshold: number;
  targetPerNiche: number;
  error?: string;
};

export function SaasPoolShell() {
  const [data, setData] = React.useState<PoolResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/pool");
      const json = (await res.json()) as PoolResponse;
      if (!res.ok) throw new Error(json.error ?? "Load failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pool disponible par niche</CardTitle>
          <CardDescription>
            Alerte &lt; {SAAS_CAPACITY.poolAlertThreshold.toLocaleString("fr-FR")} ·
            cible {SAAS_CAPACITY.poolTargetPerNiche.toLocaleString("fr-FR")} /
            niche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {data
            ? (Object.keys(data.available) as SaasNiche[]).map((niche) => {
                const count = data.available[niche];
                const low = count < data.alertThreshold;
                return (
                  <div
                    key={niche}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-sm font-medium capitalize">{niche}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {count.toLocaleString("fr-FR")}
                      </span>
                      {low ? (
                        <Badge variant="destructive">Bas</Badge>
                      ) : (
                        <Badge variant="outline">OK</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            : (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            )}
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Rafraîchir
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statuts prospect_pool</CardTitle>
          <CardDescription>Répartition globale du stock</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data
            ? Object.entries(data.statusCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{status}</span>
                  <span className="tabular-nums">
                    {count.toLocaleString("fr-FR")}
                  </span>
                </div>
              ))
            : null}
        </CardContent>
      </Card>
    </div>
  );
}
