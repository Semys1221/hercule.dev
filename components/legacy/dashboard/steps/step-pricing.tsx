"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StepPricingProps = {
  slug: string;
};

export function StepPricing({ slug }: StepPricingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Paiement indisponible");
      }
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur paiement");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Votre prix d&apos;accès — Hercule Starter</CardTitle>
          <CardDescription>
            Paiement sécurisé Stripe pour activer votre livraison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={startCheckout} disabled={loading}>
            {loading ? "Redirection…" : "Procéder au paiement"}
          </Button>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
