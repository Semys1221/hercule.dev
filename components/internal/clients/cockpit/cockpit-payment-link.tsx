"use client";

import { useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

type CockpitPaymentLinkProps = {
  data: ClientCockpitData;
};

export function CockpitPaymentLink({ data }: CockpitPaymentLinkProps) {
  const [pending, setPending] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ variant: "success" | "error"; text: string } | null>(
    null,
  );

  if (data.category !== "agence") return null;

  async function createLink() {
    setPending(true);
    setMessage(null);
    setCheckoutUrl(null);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: data.slug }),
      });
      const json = (await response.json()) as {
        error?: string;
        clientSecret?: string;
        sessionId?: string;
      };
      if (!response.ok) throw new Error(json.error ?? "Erreur création lien");
      // The checkout URL for ops to share is constructed from the session client secret
      // In embedded mode, ops copies the dashboard URL — the redirect_url handles it.
      // For payment links, the ops shares the dashboard URL with ?checkout=1
      setCheckoutUrl(`${window.location.origin}/dashboard/${data.slug}?checkout=1`);
      setMessage({
        variant: "success",
        text: "Session Stripe créée — partagez le lien dashboard ci-dessous avec l'agence.",
      });
    } catch (err) {
      setMessage({
        variant: "error",
        text: err instanceof Error ? err.message : "Erreur",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      {data.isPaid ? (
        <InternalStatusAlert
          variant="success"
          message="Paiement déjà reçu pour ce compte."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Créer un lien de paiement</CardTitle>
              <CardDescription>
                Génère une session Stripe Checkout et enregistre un row{" "}
                <code>payments.pending</code>. Partagez ensuite le lien dashboard à l&apos;agence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message ? (
                <InternalStatusAlert variant={message.variant} message={message.text} />
              ) : null}
              {checkoutUrl ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Lien à partager :</p>
                  <Input readOnly value={checkoutUrl} className="font-mono text-xs" />
                </div>
              ) : null}
              <Button
                type="button"
                disabled={pending}
                onClick={() => void createLink()}
              >
                {pending ? "Création…" : "Créer le lien Stripe"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
