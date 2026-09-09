"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";
import { formatFrenchDate } from "@/lib/retraction/dates";

type RetractionWaiverCardProps = {
  data: DashboardData;
  onSuccess?: () => void;
};

export function RetractionWaiverCard({ data, onSuccess }: RetractionWaiverCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data.retraction?.canWaive) {
    return null;
  }

  const endsLabel = data.retraction.endsAt
    ? formatFrenchDate(new Date(data.retraction.endsAt))
    : "bientôt";

  async function handleWaive() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(data.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiveRetraction: true }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Activation impossible");
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6 border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="size-4 text-amber-400" />
          Délai de rétractation en cours
        </CardTitle>
        <CardDescription>
          Votre activation est prévue le {endsLabel}. Vous pouvez renoncer à ce délai pour
          démarrer immédiatement.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="button" onClick={() => void handleWaive()} disabled={loading}>
          {loading ? "Activation…" : "Démarrer maintenant"}
        </Button>
      </CardContent>
    </Card>
  );
}
