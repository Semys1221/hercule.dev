"use client";

import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardData } from "@/lib/dashboard/types";

import { DashboardActive } from "./dashboard-active";
import { DashboardComptable } from "./dashboard-comptable";
import { DashboardState } from "./dashboard-state";
import { OnboardingPreviewWizard } from "./onboarding-preview-wizard";
import {
  OnboardingTransition,
  shouldShowOnboardingTransition,
} from "./onboarding-transition";

type DashboardShellProps = {
  slug: string;
  paidQuery?: string | null;
};

export function DashboardShell({ slug, paidQuery }: DashboardShellProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransition, setShowTransition] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/${encodeURIComponent(slug)}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Impossible de charger le dashboard");
      }
      setData(body as DashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, paidQuery]);

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

  if (
    data.dashboardMode === "comptable_active" ||
    data.dashboardMode === "comptable_pending"
  ) {
    const comptableData = data as typeof data & {
      comptable?: { offerType: string | null; succeededAt: string | null };
    };
    return (
      <DashboardComptable
        slug={data.slug}
        isPaid={data.isPaid}
        firstName={data.firstName}
        company={data.company}
        offerType={comptableData.comptable?.offerType ?? null}
      />
    );
  }

  if (data.dashboardMode === "dashboard_active") {
    return <DashboardActive data={data} />;
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
