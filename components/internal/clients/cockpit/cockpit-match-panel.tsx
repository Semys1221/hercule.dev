"use client";

import { useEffect, useState } from "react";

import type { ClientRow } from "@/app/api/admin/clients/route";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPOSE_MATCH_ACTION_HELP } from "@/lib/admin/clients/action-help";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

import { CockpitActionHint } from "./cockpit-action-hint";

type CockpitMatchPanelProps = {
  data: ClientCockpitData;
  onUpdated: () => Promise<void>;
};

export function CockpitMatchPanel({ data, onUpdated }: CockpitMatchPanelProps) {
  const counterpartCategory = data.category === "agence" ? "entreprise" : "agence";
  const [options, setOptions] = useState<ClientRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/clients?category=${counterpartCategory}&all=true`)
      .then((response) => response.json() as Promise<{ clients?: ClientRow[] }>)
      .then((body) => {
        if (!cancelled) setOptions(body.clients ?? []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [counterpartCategory]);

  async function confirm() {
    if (!selectedId) return;
    setPending(true);
    setMessage(null);
    const payload =
      data.category === "agence"
        ? { agenceId: data.id, entrepriseId: selectedId }
        : { agenceId: selectedId, entrepriseId: data.id };
    try {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Match impossible");
      await onUpdated();
      setMessage({ variant: "success", text: "Match proposé — email entreprise envoyé." });
    } catch (error) {
      setMessage({
        variant: "error",
        text: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      {message ? (
        <InternalStatusAlert variant={message.variant} message={message.text} />
      ) : null}
      <p className="text-sm text-muted-foreground">
        Propose une {counterpartCategory} via `createMatchAndPropose`.
      </p>
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Choisir une ${counterpartCategory}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.company ?? option.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" disabled={!selectedId || pending} onClick={() => void confirm()}>
        {pending ? "Envoi…" : PROPOSE_MATCH_ACTION_HELP.buttonLabel}
      </Button>
      <CockpitActionHint help={PROPOSE_MATCH_ACTION_HELP} />
    </div>
  );
}
