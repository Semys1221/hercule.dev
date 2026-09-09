"use client";

import { useCallback, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type BalancePaymentCardProps = {
  data: DashboardData;
  onRefresh: () => void;
};

export function BalancePaymentCard({ data, onRefresh }: BalancePaymentCardProps) {
  const schedule = data.paymentSchedule;
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!schedule?.balanceDue) {
    return null;
  }

  const deliveryPlan = data.deliveryPlan;
  const total = deliveryPlan?.attributionsTotal ?? 0;

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    setError(null);
    const response = await fetch("/api/payments/checkout-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: data.slug }),
    });
    const body = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !body.clientSecret) {
      const msg = body.error ?? "Paiement indisponible";
      setError(msg);
      throw new Error(msg);
    }
    return body.clientSecret;
  }, [data.slug]);

  if (checkoutStarted) {
    return (
      <Card className="mt-6 border-foreground/20">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Régler le solde</CardTitle>
          <CardDescription>
            {formatEuros(schedule.balanceAmountCents)} — livraison de vos {total} contrats
            complète.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!error ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-foreground/20">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Solde à régler</CardTitle>
        <CardDescription>
          Vos {total} contrats PME sécurisés ont été livrés. Le solde de{" "}
          {formatEuros(schedule.balanceAmountCents)} est dû pour clôturer votre compte de
          contrats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Paiement final — 50 %</AlertTitle>
          <AlertDescription>
            Acompte déjà réglé. Finalisez le paiement pour solder votre formule.
          </AlertDescription>
        </Alert>
        <Button type="button" onClick={() => setCheckoutStarted(true)}>
          Régler {formatEuros(schedule.balanceAmountCents)}
        </Button>
      </CardContent>
    </Card>
  );
}
