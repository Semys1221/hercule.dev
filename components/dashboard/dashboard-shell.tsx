"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardActive } from "./dashboard-active";
import { DashboardComptable } from "./dashboard-comptable";
import { DashboardState } from "./dashboard-state";
import { DashboardUnavailable } from "./dashboard-unavailable";
import { OnboardingEntrepriseWizard } from "./onboarding-entreprise-wizard";
import { OnboardingPreviewWizard } from "./onboarding-preview-wizard";
import {
  OnboardingTransition,
  shouldShowOnboardingTransition,
} from "./onboarding-transition";

type DashboardShellProps = {
  slug: string;
  paidQuery?: string | null;
  checkoutSessionId?: string | null;
};

const POST_PAYMENT_MODES = new Set<DashboardData["dashboardMode"]>([
  "comptable_onboarding",
  "comptable_active",
  "dashboard_active",
  "dashboard_state",
]);

export function DashboardShell({
  slug,
  paidQuery,
  checkoutSessionId,
}: DashboardShellProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  const loadDashboard = useCallback(async (): Promise<DashboardData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(slug)}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger le dashboard");
      }
      const nextData = body as DashboardData;
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
        await loadDashboard();
        return;
      }

      if (checkoutSessionId) {
        try {
          const syncResponse = await fetch("/api/payments/sync-comptable-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: checkoutSessionId }),
          });
          const syncBody = (await syncResponse.json()) as {
            synced?: boolean;
            reason?: string;
          };

          // #region agent log
          fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "454528",
            },
            body: JSON.stringify({
              sessionId: "454528",
              runId: "post-payment-sync",
              hypothesisId: "A,C",
              location: "dashboard-shell.tsx:bootstrapAfterPayment",
              message: "client sync after Stripe return",
              data: {
                slug,
                hasCheckoutSessionId: Boolean(checkoutSessionId),
                synced: syncBody.synced ?? null,
                reason: syncBody.reason ?? null,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        } catch (syncError) {
          console.error("[dashboard-shell] comptable checkout sync failed:", syncError);
        }
      }

      let latest = await loadDashboard();
      let attempts = 0;
      while (
        !cancelled &&
        latest &&
        !POST_PAYMENT_MODES.has(latest.dashboardMode) &&
        attempts < 6
      ) {
        attempts += 1;
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 1500);
        });
        if (cancelled) {
          return;
        }
        latest = await loadDashboard();
      }

      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "454528",
        },
        body: JSON.stringify({
          sessionId: "454528",
          runId: "post-payment-sync",
          hypothesisId: "D",
          location: "dashboard-shell.tsx:bootstrapAfterPayment:done",
          message: "dashboard loaded after payment return",
          data: {
            slug,
            dashboardMode: latest?.dashboardMode ?? null,
            attempts,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }

    void bootstrapAfterPayment();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, paidQuery, checkoutSessionId, slug]);

  /** Called after the onboarding form is submitted successfully. */
  function handleOnboardingComplete() {
    const show = shouldShowOnboardingTransition();
    if (show) {
      setShowTransition(true);
    } else {
      void loadDashboard();
    }
  }

  /** Called when the transition animation finishes. */
  function handleTransitionDone() {
    setShowTransition(false);
    void loadDashboard();
  }

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
          <AlertDescription>{error || "Dashboard introuvable"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Transition overlay takes priority over any mode
  if (showTransition) {
    return <OnboardingTransition onDone={handleTransitionDone} />;
  }

  if (data.dashboardMode === "unavailable") {
    return <DashboardUnavailable />;
  }

  if (
    data.dashboardMode === "comptable_active" ||
    data.dashboardMode === "comptable_pending" ||
    data.dashboardMode === "comptable_not_paid" ||
    data.dashboardMode === "comptable_onboarding"
  ) {
    return (
      <DashboardComptable
        data={data}
        onRefresh={loadDashboard}
        onOnboardingComplete={handleOnboardingComplete}
      />
    );
  }

  if (data.dashboardMode === "entreprise_preview") {
    return <OnboardingEntrepriseWizard data={data} onRefresh={loadDashboard} />;
  }

  if (data.dashboardMode === "dashboard_active") {
    return <DashboardActive data={data} onRefresh={loadDashboard} />;
  }

  if (data.dashboardMode === "dashboard_state") {
    return (
      <DashboardState
        data={data}
        onOnboardingComplete={handleOnboardingComplete}
      />
    );
  }

  // onboarding_preview
  return <OnboardingPreviewWizard data={data} onRefresh={loadDashboard} />;
}
