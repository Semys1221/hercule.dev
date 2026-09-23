"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDecFreeTrialOffer } from "@/lib/clients/dec-free-trial";
import type { ClientDashboardData } from "@/lib/clients/types";
import {
  selectSlugState,
  useClientOnboardingStore,
} from "@/lib/clients/onboarding-store";
import { DashboardUnavailable } from "@/components/legacy/dashboard/dashboard-unavailable";
import { DashboardBrandHeader, DashboardPageHeader } from "@/components/legacy/dashboard/brand-header";

import { ClientBootScreen } from "./client-boot-screen";
import { ClientDashboardActive } from "./client-dashboard-active";
import { ClientMonthlyRenewalDialog } from "./client-monthly-renewal-dialog";
import { ClientOnboardingTunnel } from "./onboarding/client-onboarding-tunnel";

type ClientDashboardShellProps = {
  slug: string;
  paidQuery?: string | null;
  checkoutSessionId?: string | null;
};

type BootPhase = "loading" | "holding" | "exiting" | "done";

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
  const [revealDashboard, setRevealDashboard] = useState(false);
  const [bootPhase, setBootPhase] = useState<BootPhase>("loading");
  const [bootProgress, setBootProgress] = useState(12);
  const [showWelcomeOnBoot, setShowWelcomeOnBoot] = useState(false);
  const bootHoldStartedRef = useRef(false);

  const hydrated = useClientOnboardingStore((s) => s.hydrated);
  const ensureSlug = useClientOnboardingStore((s) => s.ensureSlug);
  const markWelcomeSeen = useClientOnboardingStore((s) => s.markWelcomeSeen);
  const setHydrated = useClientOnboardingStore((s) => s.setHydrated);

  useEffect(() => {
    setRevealDashboard(false);
    setBootPhase("loading");
    setBootProgress(12);
    setShowWelcomeOnBoot(false);
    bootHoldStartedRef.current = false;
  }, [slug]);

  useEffect(() => {
    const unsub = useClientOnboardingStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useClientOnboardingStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, [setHydrated]);

  useEffect(() => {
    if (data?.firstName !== undefined) {
      ensureSlug(slug, data.firstName);
    } else {
      ensureSlug(slug);
    }
  }, [slug, data?.firstName, ensureSlug]);

  const loadClient = useCallback(
    async (opts?: { soft?: boolean }): Promise<ClientDashboardData | null> => {
      if (!opts?.soft) {
        setLoading(true);
        setBootPhase("loading");
        setBootProgress(12);
        bootHoldStartedRef.current = false;
      }
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
        if (!opts?.soft) {
          setLoading(false);
        }
      }
    },
    [slug],
  );

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

  useEffect(() => {
    if (bootPhase !== "loading" || !loading || !hydrated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setBootProgress((current) => Math.min(80, current + 1.2));
    }, 40);

    return () => window.clearInterval(intervalId);
  }, [bootPhase, loading, hydrated]);

  const dataReady = !loading && hydrated && Boolean(data) && !error;

  useEffect(() => {
    if (!dataReady || bootHoldStartedRef.current) {
      return;
    }

    bootHoldStartedRef.current = true;
    setBootProgress(100);

    const local = selectSlugState(useClientOnboardingStore.getState().bySlug, slug);
    const isFirstActiveVisit =
      data?.clientMode === "client_active" && !local.welcomeSeenAt && !revealDashboard;

    setShowWelcomeOnBoot(isFirstActiveVisit);
    setBootPhase("holding");

    const holdMs = isFirstActiveVisit ? 1200 : 200;
    const holdTimer = window.setTimeout(() => {
      if (isFirstActiveVisit) {
        markWelcomeSeen(slug);
        setRevealDashboard(true);
      }
      setBootPhase("exiting");
    }, holdMs);

    return () => window.clearTimeout(holdTimer);
  }, [dataReady, data?.clientMode, slug, revealDashboard, markWelcomeSeen]);

  useEffect(() => {
    if (!loading && hydrated && error) {
      setBootPhase("done");
    }
  }, [loading, hydrated, error]);

  const showBootOverlay = bootPhase !== "done";

  function renderContent() {
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
                  <Link
                    href={
                      isDecFreeTrialOffer(data.offerType)
                        ? "/dec/essai"
                        : "/conference/inscription"
                    }
                  >
                    Accéder à la page de paiement
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }

    if (data.clientMode === "client_onboarding") {
      return (
        <ClientOnboardingTunnel
          data={data}
          paidConfirmed={paidQuery === "1"}
          onCompleted={() => void loadClient({ soft: true })}
        />
      );
    }

    if (bootPhase !== "done") {
      return null;
    }

    return (
      <>
        <ClientDashboardActive data={data} onRefresh={() => void loadClient()} />
        <ClientMonthlyRenewalDialog
          slug={slug}
          announcement={data.monthlyRenewalAnnouncement}
          onResolved={() => void loadClient({ soft: true })}
        />
      </>
    );
  }

  return (
    <>
      {showBootOverlay ? (
        <ClientBootScreen
          progress={bootProgress}
          showWelcome={showWelcomeOnBoot}
          exiting={bootPhase === "exiting"}
          onExitComplete={() => setBootPhase("done")}
        />
      ) : null}
      {renderContent()}
    </>
  );
}
