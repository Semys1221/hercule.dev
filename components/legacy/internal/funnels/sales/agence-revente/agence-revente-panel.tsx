"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  readCachedPipelineMetrics,
  writeCachedPipelineMetrics,
  type PipelineMetricsClientPayload,
} from "@/lib/agence/pipeline-metrics-client-cache";
import { resolvePipelineInitialServices } from "@/lib/agence/pipeline-services-from-qualification";
import { buildPipelineDevQualification } from "@/lib/legacy/calendly/pipeline-dev-mode";
import { normalizePipelineQualification } from "@/lib/legacy/calendly/pipeline-qualification-schema";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import type { EnrichedCalendlyBooking } from "@/lib/legacy/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/legacy/link-tracking/types";

import { AgenceReventeProductView } from "./agence-revente-product-view";
import {
  AgenceReventeWizard,
  type AgenceReventeWizardValues,
} from "./agence-revente-wizard";

type AgenceReventePanelProps = {
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  qualificationValues: SalesQualificationValues;
  developerModeEnabled: boolean;
};

export function AgenceReventePanel({
  selectedLead,
  selectedBooking,
  qualificationValues,
  developerModeEnabled,
}: AgenceReventePanelProps) {
  const initialServices = resolvePipelineInitialServices({
    bookingQuestions: selectedBooking?.questions,
    leadQuestions: selectedLead?.calendly_questions,
    qualificationValues,
  });
  const initialCompanyName =
    selectedLead?.company?.trim() ||
    selectedBooking?.company?.trim() ||
    "";
  const [phase, setPhase] = useState<"wizard" | "product">("wizard");
  const [qualification, setQualification] = useState<AgenceReventeWizardValues | null>(
    null,
  );
  const [metricsPayload, setMetricsPayload] = useState<PipelineMetricsClientPayload | null>(
    () => readCachedPipelineMetrics(),
  );
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const metricsPreloadStartedRef = useRef(false);

  const loadMetrics = useCallback(async () => {
    const cached = readCachedPipelineMetrics();
    if (cached) {
      setMetricsPayload(cached);
      return;
    }

    setLoadingMetrics(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/agence/pipeline-metrics");
      const body = (await response.json()) as PipelineMetricsClientPayload & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Impossible de charger les métriques pipeline");
      }
      writeCachedPipelineMetrics(body);
      setMetricsPayload(body);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les métriques pipeline",
      );
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLead || metricsPreloadStartedRef.current || metricsPayload) {
      return;
    }
    metricsPreloadStartedRef.current = true;
    void loadMetrics();
  }, [loadMetrics, metricsPayload, selectedLead]);

  if (!selectedLead) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Alert className="max-w-lg">
          <AlertDescription>
            Sélectionnez un prospect dans l&apos;onglet Session (étape Rendez-vous)
            avant d&apos;ouvrir Acheteur.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const lead = selectedLead;

  async function persistQualification(values: AgenceReventeWizardValues) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/agence/pipeline-qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...normalizePipelineQualification({
            ...values,
            roi_matches_objective: values.roi_matches_objective ?? "yes",
          }),
          slug: lead.slug,
          metrics_snapshot: metricsPayload
            ? {
                activeCount: metricsPayload.metrics.activeCount,
                prediction30Days: metricsPayload.metrics.prediction30Days,
              }
            : undefined,
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Enregistrement impossible — le pipeline reste accessible.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function openProduct(values: AgenceReventeWizardValues) {
    setQualification(values);
    setPhase("product");
    await persistQualification(values);
  }

  function handleDevSkip() {
    const mock = buildPipelineDevQualification({
      email: lead.email,
      company_name: "Agence Dev",
    }) as AgenceReventeWizardValues;
    void openProduct(mock);
  }

  if (phase === "product" && qualification) {
    if (loadingMetrics || !metricsPayload) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
          Chargement du pipeline…
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <AgenceReventeProductView
          metrics={metricsPayload.metrics}
          productName={metricsPayload.product.name}
          productPriceEur={metricsPayload.product.priceEur}
          paymentLinkUrl={metricsPayload.product.paymentLinkUrl}
          qualification={qualification}
        />
      </div>
    );
  }

  return (
    <AgenceReventeWizard
      initialEmail={lead.email}
      initialCompanyName={initialCompanyName}
      initialServices={initialServices}
      developerModeEnabled={developerModeEnabled}
      saving={saving}
      error={error}
      onSubmit={(values) => void openProduct(values)}
      onDevSkip={developerModeEnabled ? handleDevSkip : undefined}
    />
  );
}
