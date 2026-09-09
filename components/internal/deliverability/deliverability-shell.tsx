"use client";

import { RefreshCw } from "lucide-react";
import * as React from "react";

import { DeliverabilityAccountsTable } from "@/components/internal/deliverability/deliverability-accounts-table";
import { DeliverabilityControlPanel } from "@/components/internal/deliverability/deliverability-control-panel";
import { DeliverabilityPlacementChart } from "@/components/internal/deliverability/deliverability-placement-chart";
import { DeliverabilitySettingsForm } from "@/components/internal/deliverability/deliverability-settings-form";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type {
  DeliverabilityAccountRow,
  DeliverabilitySettings,
  DeliverabilitySnapshot,
} from "@/lib/admin/deliverability/types";

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)} %`;
}

function KpiCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function DeliverabilityShell() {
  const [snapshot, setSnapshot] = React.useState<DeliverabilitySnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("overview");

  const loadSnapshot = React.useCallback(async (options?: { refresh?: boolean; vitals?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.refresh) params.set("refresh", "1");
      if (options?.vitals) params.set("vitals", "1");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await fetch(`/api/admin/deliverability${suffix}`);
      const json = (await response.json()) as DeliverabilitySnapshot & { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Chargement impossible");
      }
      setSnapshot(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement impossible";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const selectedAccount = React.useMemo<DeliverabilityAccountRow | null>(() => {
    if (!snapshot || !selectedEmail) return null;
    return snapshot.accounts.find((row) => row.email === selectedEmail) ?? null;
  }, [snapshot, selectedEmail]);

  const criticalAccounts = React.useMemo(
    () => snapshot?.accounts.filter((row) => row.health === "critical") ?? [],
    [snapshot],
  );

  async function handleRecheckAllVitals() {
    try {
      const response = await fetch("/api/admin/deliverability/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await response.json()) as {
        snapshot?: DeliverabilitySnapshot;
        error?: string;
      };
      if (!response.ok || !json.snapshot) {
        throw new Error(json.error ?? "Recheck DNS impossible");
      }
      setSnapshot(json.snapshot);
      toast({ title: "DNS recheck terminé" });
    } catch (err) {
      toast({
        title: "Erreur DNS",
        description: err instanceof Error ? err.message : "Recheck impossible",
        variant: "destructive",
      });
    }
  }

  async function handleRecheckEmailVitals(email: string) {
    try {
      await fetch("/api/admin/deliverability/accounts/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "test_vitals" }),
      });
      await loadSnapshot({ refresh: true, vitals: true });
      toast({ title: `DNS recheck — ${email}` });
    } catch (err) {
      toast({
        title: "Erreur DNS",
        description: err instanceof Error ? err.message : "Recheck impossible",
        variant: "destructive",
      });
    }
  }

  function handleSettingsSaved(settings: DeliverabilitySettings) {
    setSnapshot((current) => (current ? { ...current, settings } : current));
    void loadSnapshot({ refresh: true });
  }

  if (loading && !snapshot) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Chargement des inboxes Instantly…
      </div>
    );
  }

  if (error && !snapshot) {
    return <InternalStatusAlert variant="error" message={error} />;
  }

  if (!snapshot) {
    return (
      <InternalStatusAlert
        variant="error"
        message="Snapshot deliverability indisponible."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            Dernière sync :{" "}
            {new Intl.DateTimeFormat("fr-FR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(snapshot.fetchedAt))}
          </span>
          {snapshot.cached ? <Badge variant="secondary">Cache</Badge> : null}
          {snapshot.vitalsCheckedAt ? (
            <Badge variant="outline">DNS testés</Badge>
          ) : (
            <Badge variant="outline">DNS non testés</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => void loadSnapshot({ refresh: true })}
          >
            <RefreshCw className="size-4" />
            Rafraîchir
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleRecheckAllVitals()}>
            Recheck DNS (tous)
          </Button>
        </div>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="inboxes">Inboxes ({snapshot.accounts.length})</TabsTrigger>
          <TabsTrigger value="control">Contrôle</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard title="Inboxes" value={snapshot.kpis.totalAccounts} />
            <KpiCard title="Actives" value={snapshot.kpis.activeAccounts} />
            <KpiCard
              title="Health score moyen"
              value={snapshot.kpis.averageHealthScore ?? "—"}
            />
            <KpiCard
              title="Inbox rate moyen"
              value={formatPercent(snapshot.kpis.averageInboxRate)}
            />
            <KpiCard
              title="Spam rate moyen"
              value={formatPercent(snapshot.kpis.averageSpamRate)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Placement warmup (14j)</CardTitle>
                <CardDescription>
                  Emails warmup atterris en inbox vs spam, agrégés sur toutes les inboxes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeliverabilityPlacementChart data={snapshot.placementSeries} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes</CardTitle>
                <CardDescription>Comptes nécessitant une attention immédiate.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">Critique {snapshot.kpis.criticalCount}</Badge>
                  <Badge variant="secondary">Surveillance {snapshot.kpis.watchCount}</Badge>
                  <Badge variant="outline">Pause {snapshot.kpis.pausedCount}</Badge>
                  <Badge variant="destructive">Erreur {snapshot.kpis.errorCount}</Badge>
                  <Badge variant="outline">DNS KO {snapshot.kpis.dnsFailureDomains}</Badge>
                </div>
                {criticalAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun compte critique.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {criticalAccounts.slice(0, 8).map((row) => (
                      <li key={row.email} className="flex flex-col gap-0.5">
                        <span className="font-medium">{row.email}</span>
                        <span className="text-muted-foreground">
                          Score {row.warmup.healthScore ?? "—"} · Inbox{" "}
                          {formatPercent(row.warmup.inboxRate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inboxes">
          <DeliverabilityAccountsTable
            accounts={snapshot.accounts}
            selectedEmail={selectedEmail}
            onSelect={(email) => {
              setSelectedEmail(email);
              setTab("control");
            }}
            onRefreshVitals={(email) => void handleRecheckEmailVitals(email)}
          />
        </TabsContent>

        <TabsContent value="control" className="flex flex-col gap-4">
          <DeliverabilityControlPanel
            account={selectedAccount}
            filteredAccounts={snapshot.accounts}
            onActionComplete={() => void loadSnapshot({ refresh: true })}
          />
        </TabsContent>

        <TabsContent value="settings">
          <DeliverabilitySettingsForm
            settings={snapshot.settings}
            onSaved={handleSettingsSaved}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
