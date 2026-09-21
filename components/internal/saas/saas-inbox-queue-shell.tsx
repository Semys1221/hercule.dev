"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { InboxProvisionQueueRow } from "@/lib/capacity/types";
import { SAAS_CAPACITY } from "@/lib/capacity/constants";

type Ticket = InboxProvisionQueueRow & {
  slot?: { id: string; agence_id: string; capacity_status: string } | null;
};

export function SaasInboxQueueShell() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [emailsText, setEmailsText] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/inbox-queue");
      const json = (await res.json()) as {
        tickets?: Ticket[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Load failed");
      setTickets(json.tickets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  async function markInProgress(id: string) {
    setBusy(true);
    try {
      await fetch("/api/admin/saas/inbox-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "in_progress", notes }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function provisionInboxes() {
    if (!selected) return;
    const emails = emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (emails.length === 0) {
      setError("Saisir au moins un email inbox");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/saas/inbox-queue/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selected.id,
          inboxes: emails.map((email) => ({ email })),
          activateSlot: emails.length >= SAAS_CAPACITY.inboxPerClient,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Provision failed");
      setEmailsText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>File provision inbox</CardTitle>
          <CardDescription>
            Semi-auto — commander {SAAS_CAPACITY.inboxPerClient} inbox Instantly
            DFY / domaines, puis coller les emails ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun ticket. Les tickets se créent au checkout SaaS autonome.
            </p>
          ) : (
            tickets.map((ticket) => (
              <Button
                key={ticket.id}
                type="button"
                variant={selectedId === ticket.id ? "secondary" : "outline"}
                className="flex h-auto w-full items-center justify-between px-3 py-2 text-left"
                onClick={() => setSelectedId(ticket.id)}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Slot {ticket.client_slot_id.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.inboxes_provisioned}/{ticket.inboxes_requested}{" "}
                    inbox · {new Date(ticket.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <Badge variant="outline">{ticket.status}</Badge>
              </Button>
            ))
          )}
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Rafraîchir
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provisionner</CardTitle>
          <CardDescription>
            {selected
              ? `Ticket ${selected.id.slice(0, 8)}… — statut ${selected.status}`
              : "Sélectionner un ticket"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={"inbox1@domaine.fr\ninbox2@domaine.fr\n…"}
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            disabled={!selected || busy}
            rows={10}
          />
          <Textarea
            placeholder="Notes ops (optionnel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!selected || busy}
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!selected || busy}
              onClick={() => selected && void markInProgress(selected.id)}
              variant="secondary"
            >
              Marquer en cours
            </Button>
            <Button
              disabled={!selected || busy}
              onClick={() => void provisionInboxes()}
            >
              Enregistrer inbox
            </Button>
            <Button asChild variant="outline">
              <Link href="/internal/saas/clients">Voir clients</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
