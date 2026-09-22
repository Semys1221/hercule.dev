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
import type { ClientDashboardData } from "@/lib/clients/types";
import { clientEngagementLabel } from "@/lib/commercial/conference-pricing";

type ClientBillingPortalButtonProps = {
  slug: string;
  available: boolean;
};

export function ClientBillingPortalButton({
  slug,
  available,
}: ClientBillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!available) {
    return null;
  }

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/clients/${encodeURIComponent(slug)}/billing-portal`,
        { method: "POST" },
      );
      const body = await response.json();
      if (!response.ok || !body.url) {
        throw new Error(body.error || "Impossible d'ouvrir le portail");
      }
      window.location.href = body.url as string;
    } catch (error) {
      console.error("[ClientBillingPortalButton]", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void handleClick()} disabled={loading}>
      {loading ? "Ouverture…" : "Gérer mon abonnement et mes factures"}
    </Button>
  );
}

type ClientSubscriptionCardProps = {
  data: ClientDashboardData;
};

export function ClientSubscriptionCard({ data }: ClientSubscriptionCardProps) {
  const engagementLabel = clientEngagementLabel({
    clientType: data.clientType,
    billing: data.billing,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Votre formule</CardTitle>
        <CardDescription>{engagementLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Mode :{" "}
          <span className="text-foreground font-medium">
            {data.billing === "monthly" ? "Abonnement mensuel" : "Pack"}
          </span>
        </p>
        <ClientBillingPortalButton
          slug={data.slug}
          available={data.billingPortal.available}
        />
      </CardContent>
    </Card>
  );
}
