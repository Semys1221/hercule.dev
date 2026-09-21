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
import { Input } from "@/components/ui/input";
import type { ClientOutreachSlot } from "@/lib/capacity/types";
import { SAAS_CAPACITY } from "@/lib/capacity/constants";

export function SaasClientsShell() {
  const [slots, setSlots] = React.useState<ClientOutreachSlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [campaignId, setCampaignId] = React.useState("");
  const [listId, setListId] = React.useState("");
  const [calendlyUrl, setCalendlyUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/slots");
      const json = (await res.json()) as {
        slots?: ClientOutreachSlot[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Load failed");
      setSlots(json.slots ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  function startEdit(slot: ClientOutreachSlot) {
    setEditingId(slot.id);
    setCampaignId(slot.instantly_campaign_id ?? "");
    setListId(slot.instantly_list_id ?? "");
    setCalendlyUrl(slot.calendly_scheduling_url ?? "");
  }

  async function save(slotId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/saas/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slotId,
          instantly_campaign_id: campaignId || null,
          instantly_list_id: listId || null,
          calendly_scheduling_url: calendlyUrl || null,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(
    slotId: string,
    capacity_status: ClientOutreachSlot["capacity_status"],
  ) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/saas/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slotId, capacity_status }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients SaaS ({slots.length}/{SAAS_CAPACITY.maxActiveClients})</CardTitle>
        <CardDescription>
          Slots outreach — {SAAS_CAPACITY.inboxPerClient} inbox · objectif{" "}
          {SAAS_CAPACITY.rdvGoalMonthly} RDV bookés / mois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="space-y-2 rounded-md border border-border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  Agence {slot.agence_id.slice(0, 8)}…
                </p>
                <p className="text-xs text-muted-foreground">
                  RDV {slot.rdv_booked_this_month}/{slot.rdv_goal_monthly} ·
                  envois {slot.sends_this_month}/{SAAS_CAPACITY.monthlySendBudget}
                </p>
              </div>
              <Badge variant="outline">{slot.capacity_status}</Badge>
            </div>
            {editingId === slot.id ? (
              <div className="grid gap-2">
                <Input
                  placeholder="Instantly campaign ID"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
                <Input
                  placeholder="Instantly list ID"
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                />
                <Input
                  placeholder="Calendly scheduling URL"
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void save(slot.id)}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(slot)}
                >
                  Éditer campagnes
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || slot.capacity_status === "active"}
                  onClick={() => void setStatus(slot.id, "active")}
                >
                  Activer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void setStatus(slot.id, "paused")}
                >
                  Pause
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Rafraîchir
        </Button>
      </CardContent>
    </Card>
  );
}
