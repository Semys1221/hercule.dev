"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ClientDashboardData } from "@/lib/clients/types";
import { DashboardUnavailable } from "@/components/legacy/dashboard/dashboard-unavailable";
import { DashboardBrandHeader, DashboardPageHeader } from "@/components/legacy/dashboard/brand-header";

import { ClientDashboardActive } from "./client-dashboard-active";
import { ClientOnboardingForm } from "./client-onboarding-form";

type ClientDashboardShellProps = {
  slug: string;
  paidQuery?: string | null;
  checkoutSessionId?: string | null;
};

const POST_PAYMENT_MODES = new Set<ClientDashboardData["clientMode"]>([
  "client_onboarding",
  "client_active",
]);

export function ClientDashboardShell({
  slug,
  paidQuery,
  checkoutSessionId,
}: ClientDashboardShellProps) {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClient = useCallback(async (): Promise<ClientDashboardData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(slug)}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger le dashboard");
      }
      const nextData = body as ClientDashboardData;
      setData(nextData);
      return nextData;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapAfterPayment() {
      if (paidQuery !== "1") {
        await loadClient();
        return;
      }

      if (checkoutSessionId) {
        try {
          await fetch("/api/payments/sync-conference-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
          });
        } catch (syncError) {
          console.error("[ClientDashboardShell] conference checkout sync failed:", syncError);
        }
      }

      let latest = await loadClient();
      let attempts = 0;
      while (
        !cancelled &&
        latest &&
        !POST_PAYMENT_MODES.has(latest.clientMode) &&
        attempts < 6
      ) {
        attempts += 1;
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 1500);
        });
        if (cancelled) {
          return;
        }
        latest = await loadClient();
      }
    }

    void bootstrapAfterPayment();

    return () => {
      cancelled = true;
    };
  }, [loadClient, paidQuery, checkoutSessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Alert variant="destructive">
          <AlertDescription>{error || "Espace client introuvable"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (data.clientMode === "unavailable") {
    return <DashboardUnavailable />;
  }

  if (data.clientMode === "client_pending") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DashboardBrandHeader />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <DashboardPageHeader
            eyebrow={data.dashboardTitle}
            title="Finalisez votre paiement"
            subtitle="Votre espace client sera disponible dès confirmation du paiement."
          />
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Paiement requis</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/conference/payment">Accéder à la page paiement</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (data.clientMode === "client_onboarding") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DashboardBrandHeader />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <DashboardPageHeader
            eyebrow={data.dashboardTitle}
            title="Bienvenue chez Hercule"
            subtitle="Indiquez votre prénom pour accéder à votre suivi de livraison."
          />
          {paidQuery === "1" ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              Paiement confirmé — complétez votre profil pour continuer.
            </p>
          ) : null}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Votre profil</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientOnboardingForm data={data} onSuccess={() => void loadClient()} />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return <ClientDashboardActive data={data} onRefresh={() => void loadClient()} />;
}
