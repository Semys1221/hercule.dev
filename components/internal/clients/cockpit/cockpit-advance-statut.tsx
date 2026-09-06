"use client";

import { useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import type { ClientCockpitData } from "@/lib/admin/clients/types";
import { PRODUCT_STATUT_LABELS, PRODUCT_STATUT_VALUES } from "@/lib/admin/clients/types";

type CockpitAdvanceStatutProps = {
  data: ClientCockpitData;
  onUpdated: () => Promise<void>;
};

export function CockpitAdvanceStatut({ data, onUpdated }: CockpitAdvanceStatutProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  async function setStatut(statut: string) {
    setPending(statut);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/clients/${data.category}/${data.slug}/statut`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Mise à jour impossible");
      await onUpdated();
      setMessage({ variant: "success", text: `Statut → ${PRODUCT_STATUT_LABELS[statut] ?? statut}` });
    } catch (error) {
      setMessage({
        variant: "error",
        text: error instanceof Error ? error.message : "Erreur",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      {message ? (
        <InternalStatusAlert variant={message.variant} message={message.text} />
      ) : null}
      <p className="text-sm text-muted-foreground">
        Statut actuel :{" "}
        <span className="text-foreground">
          {PRODUCT_STATUT_LABELS[data.productStatut] ?? data.productStatut}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {PRODUCT_STATUT_VALUES.map((statut) => (
          <Button
            key={statut}
            type="button"
            size="sm"
            variant={statut === data.productStatut ? "default" : "outline"}
            disabled={pending !== null || statut === data.productStatut}
            onClick={() => void setStatut(statut)}
          >
            {pending === statut ? "…" : PRODUCT_STATUT_LABELS[statut]}
          </Button>
        ))}
      </div>
    </div>
  );
}
