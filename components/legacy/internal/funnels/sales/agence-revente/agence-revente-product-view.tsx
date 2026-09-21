"use client";

import type { PipelineDashboardMetrics } from "@/lib/legacy/calendly/pipeline-dashboard";

import { AgenceReventePitchDeck } from "./agence-revente-pitch-deck";
import type { AgenceReventeWizardValues } from "./agence-revente-wizard";

type AgenceReventeProductViewProps = {
  metrics: PipelineDashboardMetrics;
  productName: string;
  productPriceEur: number;
  paymentLinkUrl: string;
  qualification: AgenceReventeWizardValues;
};

export function AgenceReventeProductView({
  metrics,
  productName,
  productPriceEur,
  paymentLinkUrl,
  qualification,
}: AgenceReventeProductViewProps) {
  return (
    <div className="flex h-full min-h-[70vh] flex-col">
      <AgenceReventePitchDeck
        metrics={metrics}
        qualification={qualification}
        productName={productName}
        productPriceEur={productPriceEur}
        paymentLinkUrl={paymentLinkUrl}
      />
    </div>
  );
}
