"use client";

import { Calendar, Copy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { PipelineDashboardMetrics } from "@/lib/legacy/calendly/pipeline-dashboard";
import {
  computePipelineRoi,
  computePipelineStockPotentialCa,
  formatRoiAssumptionsHint,
} from "@/lib/legacy/calendly/pipeline-roi-calculator";
import { HERCULE_LIBERAL } from "@/lib/commercial/constants";
import { cn } from "@/lib/utils";

import {
  getVisibleCapaciteBlocks,
  sumLastDailyHistory,
  type CapaciteRevealBlock,
} from "./agence-revente-pitch-steps";
import type { AgenceReventeWizardValues } from "./agence-revente-wizard";

type AgenceReventePitchCapaciteProps = {
  metrics: PipelineDashboardMetrics;
  qualification: AgenceReventeWizardValues;
  productName: string;
  productPriceEur: number;
  paymentLinkUrl: string;
  revealIndex: number;
  latestBlockIndex: number;
  calendlyAcknowledged: boolean;
  onCalendlyAcknowledge: () => void;
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRdvPerDay(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

function RoiAssumptionsHint({
  basketEur,
  closingRatePercent,
}: {
  basketEur: number;
  closingRatePercent: number;
}) {
  return (
    <span className="text-xs text-muted-foreground">
      {formatRoiAssumptionsHint(basketEur, closingRatePercent)}
    </span>
  );
}

function RoiRecapBlock({
  animationClass,
  upcomingCount,
  stockPotentialCa,
  monthlyRevenue,
  basketEur,
  closingRatePercent,
}: {
  animationClass?: string;
  upcomingCount: number;
  stockPotentialCa: number;
  monthlyRevenue: number;
  basketEur: number;
  closingRatePercent: number;
}) {
  return (
    <Card className={animationClass}>
      <CardHeader>
        <CardTitle>Votre ROI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-base leading-relaxed md:text-lg">
        <p>
          Sur les <strong>{upcomingCount} RDV</strong> du stock, le CA potentiel est de{" "}
          <strong>{formatEuro(stockPotentialCa)}</strong>{" "}
          <RoiAssumptionsHint basketEur={basketEur} closingRatePercent={closingRatePercent} />
        </p>
        <p>
          Avec ce pipeline, votre CA mensuel projeté est de{" "}
          <strong>{formatEuro(monthlyRevenue)}</strong>{" "}
          <RoiAssumptionsHint basketEur={basketEur} closingRatePercent={closingRatePercent} />
        </p>
      </CardContent>
    </Card>
  );
}

function BuyHerculeLiberalButton({ paymentLinkUrl }: { paymentLinkUrl: string }) {
  const handleCopyPaymentLink = useCallback(async () => {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "544df7" },
      body: JSON.stringify({
        sessionId: "544df7",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "agence-revente-pitch-capacite.tsx:handleCopyPaymentLink:entry",
        message: "Buy button clicked",
        data: { hasPaymentLinkUrl: Boolean(paymentLinkUrl) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      await navigator.clipboard.writeText(paymentLinkUrl);
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "544df7" },
        body: JSON.stringify({
          sessionId: "544df7",
          runId: "pre-fix",
          hypothesisId: "A",
          location: "agence-revente-pitch-capacite.tsx:handleCopyPaymentLink:success",
          message: "Clipboard write succeeded",
          data: { feedbackType: "toast-only" },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast({
        title: "Copié — envoie-le maintenant",
        description: paymentLinkUrl,
      });
    } catch {
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "544df7" },
        body: JSON.stringify({
          sessionId: "544df7",
          runId: "pre-fix",
          hypothesisId: "B",
          location: "agence-revente-pitch-capacite.tsx:handleCopyPaymentLink:error",
          message: "Clipboard write failed",
          data: {},
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast({
        title: "Copie impossible",
        description: paymentLinkUrl,
        variant: "destructive",
      });
    }
  }, [paymentLinkUrl]);

  return (
    <Button type="button" className="w-full sm:w-auto" onClick={handleCopyPaymentLink}>
      <Copy className="mr-2 size-4" />
      Acheter {HERCULE_LIBERAL.productName}
    </Button>
  );
}

function CapaciteBlock({
  block,
  metrics,
  qualification,
  productPriceEur,
  paymentLinkUrl,
  calendlyAcknowledged,
  onCalendlyAcknowledge,
  animate,
}: {
  block: CapaciteRevealBlock;
  metrics: PipelineDashboardMetrics;
  qualification: AgenceReventeWizardValues;
  productPriceEur: number;
  paymentLinkUrl: string;
  calendlyAcknowledged: boolean;
  onCalendlyAcknowledge: () => void;
  animate: boolean;
}) {
  const animationClass = animate
    ? "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500"
    : undefined;

  const roi = useMemo(
    () =>
      computePipelineRoi({
        roi_call_model: qualification.roi_call_model,
        roi_rdv_per_month: qualification.roi_rdv_per_month,
        roi_meeting_duration: qualification.roi_meeting_duration,
        roi_closing_rate: qualification.roi_closing_rate,
        roi_basket_eur: qualification.roi_basket_eur,
        pipelineCostMonthly: productPriceEur,
      }),
    [
      productPriceEur,
      qualification.roi_basket_eur,
      qualification.roi_call_model,
      qualification.roi_closing_rate,
      qualification.roi_meeting_duration,
      qualification.roi_rdv_per_month,
    ],
  );

  const stockPotentialCa = useMemo(
    () =>
      computePipelineStockPotentialCa({
        upcomingCount: metrics.upcomingCount,
        basketEur: qualification.roi_basket_eur,
        closingRatePercent: qualification.roi_closing_rate,
      }),
    [metrics.upcomingCount, qualification.roi_basket_eur, qualification.roi_closing_rate],
  );

  const last10DaysCount = sumLastDailyHistory(metrics, 10);

  if (block.type === "pipeline_rhythm") {
    return (
      <Card className={animationClass}>
        <CardHeader>
          <CardTitle>Historique du pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-base leading-relaxed md:text-lg">
          <p>
            Nous faisons actuellement{" "}
            <strong>{formatRdvPerDay(metrics.rdvPerActiveDay)} rdv</strong>.
          </p>
          <p>
            Sur les 10 derniers jours,{" "}
            <strong>{last10DaysCount} rdv</strong> ont été planifiés.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (block.type === "roi_monthly") {
    return (
      <Card className={animationClass}>
        <CardHeader>
          <CardTitle>Votre projection</CardTitle>
        </CardHeader>
        <CardContent className="text-base leading-relaxed md:text-lg">
          <p>
            Votre CA mensuel potentiel avec ce pipeline est de{" "}
            <strong>{formatEuro(roi.monthlyRevenue)}</strong>{" "}
            <RoiAssumptionsHint
              basketEur={qualification.roi_basket_eur}
              closingRatePercent={qualification.roi_closing_rate}
            />
          </p>
        </CardContent>
      </Card>
    );
  }

  if (block.type === "calendly_cue") {
    return (
      <Card className={cn("border-dashed", animationClass)}>
        <CardHeader>
          <CardTitle>Calendly live</CardTitle>
          <CardDescription>
            Partagez votre écran Calendly avec le prospect, puis continuez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant={calendlyAcknowledged ? "secondary" : "default"}
            className="w-full sm:w-auto"
            onClick={onCalendlyAcknowledge}
          >
            <Calendar className="mr-2 size-4" />
            {calendlyAcknowledged ? "Calendly montré" : "Montrer le Calendly live"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (block.type === "roi_recap") {
    return (
      <RoiRecapBlock
        animationClass={animationClass}
        upcomingCount={metrics.upcomingCount}
        stockPotentialCa={stockPotentialCa}
        monthlyRevenue={roi.monthlyRevenue}
        basketEur={qualification.roi_basket_eur}
        closingRatePercent={qualification.roi_closing_rate}
      />
    );
  }

  if (block.type === "closing") {
    return (
      <Card className={cn("border-primary/30 bg-primary/5", animationClass)}>
        <CardHeader>
          <CardTitle>La prochaine étape est simple</CardTitle>
          <CardDescription>
            Paiement réalisé sur l&apos;appel de {formatEuro(productPriceEur)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            Vous devenez propriétaire du pipeline et de ses{" "}
            <strong>{metrics.upcomingCount} RDV</strong> à venir.
          </p>
          <BuyHerculeLiberalButton paymentLinkUrl={paymentLinkUrl} />
        </CardContent>
      </Card>
    );
  }

  return null;
}

export function AgenceReventePitchCapacite({
  metrics,
  qualification,
  productPriceEur,
  paymentLinkUrl,
  revealIndex,
  latestBlockIndex,
  calendlyAcknowledged,
  onCalendlyAcknowledge,
}: AgenceReventePitchCapaciteProps) {
  const latestBlockRef = useRef<HTMLDivElement>(null);
  const blocks = getVisibleCapaciteBlocks(revealIndex);
  const animate = revealIndex === latestBlockIndex;

  useEffect(() => {
    if (latestBlockIndex < 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      latestBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [latestBlockIndex, revealIndex]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {blocks.map((block, index) => {
        const isLatest = index === blocks.length - 1;
        const blockAnimate = isLatest && animate;

        return (
          <div
            key={`${block.type}-${index}`}
            ref={isLatest ? latestBlockRef : undefined}
            className={isLatest ? "scroll-mt-6" : undefined}
          >
            <CapaciteBlock
              block={block}
              metrics={metrics}
              qualification={qualification}
              productPriceEur={productPriceEur}
              paymentLinkUrl={paymentLinkUrl}
              calendlyAcknowledged={calendlyAcknowledged}
              onCalendlyAcknowledge={onCalendlyAcknowledge}
              animate={blockAnimate}
            />
          </div>
        );
      })}
    </div>
  );
}
