"use client";

import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  computePipelineCalculator,
  type PipelineCalculatorResult,
} from "@/lib/calendly/pipeline-calculator";
import {
  PIPELINE_AVG_BASKET_EUR,
  type PipelineDashboardMetrics,
} from "@/lib/calendly/pipeline-dashboard";
import {
  PIPELINE_CAPACITY_DAYS_OPTIONS,
  PIPELINE_CLOSING_RATE_OPTIONS,
} from "@/lib/calendly/pipeline-qualification-schema";

type PipelineCalculatorCoreProps = {
  metrics: PipelineDashboardMetrics;
  initialClosingRate?: number;
  initialCapacityDays?: number;
  variant?: "full" | "pitch";
  questionTitle?: string;
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function PipelineCalculatorCore({
  metrics,
  initialClosingRate = 20,
  initialCapacityDays = 5,
  variant = "full",
  questionTitle,
}: PipelineCalculatorCoreProps) {
  const [closingRate, setClosingRate] = useState(initialClosingRate);
  const [capacityDays, setCapacityDays] = useState(initialCapacityDays);

  const result = useMemo(
    () =>
      computePipelineCalculator({
        rdvInPipeline: metrics.upcomingCount,
        prediction30Days: metrics.prediction30Days,
        basketEur: PIPELINE_AVG_BASKET_EUR,
        closingRatePercent: closingRate,
        capacityDaysPerMonth: capacityDays,
      }),
    [capacityDays, closingRate, metrics.upcomingCount, metrics.prediction30Days],
  );

  const maxCompare = Math.max(
    result.monthlyInflow,
    result.rdvTreatablePerMonth,
    1,
  );

  const isPitch = variant === "pitch";

  return (
    <div className="space-y-6">
      {isPitch && questionTitle ? (
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{questionTitle}</h2>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label>Taux de closing — {closingRate} %</Label>
          <Slider
            min={5}
            max={35}
            step={5}
            value={[closingRate]}
            onValueChange={(values) => setClosingRate(values[0] ?? 20)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {PIPELINE_CLOSING_RATE_OPTIONS.map((rate) => (
              <span key={rate}>{rate} %</span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Capacité RDV (jours / mois)</Label>
          <Select
            value={String(capacityDays)}
            onValueChange={(value) => setCapacityDays(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_CAPACITY_DAYS_OPTIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {days} jours / mois
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold">{result.rdvInPipeline}</p>
            <p className="text-xs text-muted-foreground">RDV dans le pipeline</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold">{result.rdvTreatablePerMonth}</p>
            <p className="text-xs text-muted-foreground">RDV traitables / mois</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold">
              {result.monthsToClearStock === null
                ? "—"
                : `${formatNumber(result.monthsToClearStock, 1)} mois`}
            </p>
            <p className="text-xs text-muted-foreground">Délai stock actuel</p>
          </CardContent>
        </Card>
      </div>

      {!isPitch ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Valeur / RDV converti</p>
              <p className="text-lg font-semibold">{formatEuro(result.revenuePerRdv)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CA potentiel sur le stock</p>
              <p className="text-lg font-semibold">{formatEuro(result.potentialCaOnStock)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entrées pipeline / 30 j</p>
              <p className="text-lg font-semibold">{formatNumber(result.monthlyInflow, 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Écart mensuel</p>
              <p className="text-lg font-semibold">
                {formatNumber(result.netAccumulationPerMonth, 0)}
              </p>
            </div>
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
          <span className="text-xs text-muted-foreground">Entrées / 30 j</span>
          <div className="h-2.5 overflow-hidden rounded-full border border-border bg-muted">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${(result.monthlyInflow / maxCompare) * 100}%` }}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
          <span className="text-xs text-muted-foreground">Votre capacité / mois</span>
          <div className="h-2.5 overflow-hidden rounded-full border border-border bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${(result.rdvTreatablePerMonth / maxCompare) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {result.capacityBelowInflux ? (
        <Alert>
          <AlertDescription>
            Le pipeline se remplit plus vite que votre capacité actuelle (
            {formatNumber(result.monthlyInflow, 0)} entrées / 30 j vs{" "}
            {result.rdvTreatablePerMonth} RDV traitables / mois).
          </AlertDescription>
        </Alert>
      ) : null}

      {!isPitch ? (
        <p className="text-xs text-muted-foreground">
          Panier moyen projet agence : {formatEuro(PIPELINE_AVG_BASKET_EUR)} · données
          Calendly live.
        </p>
      ) : null}
    </div>
  );
}

type AgenceReventeCalculatorProps = {
  metrics: PipelineDashboardMetrics;
  initialClosingRate?: number;
  initialCapacityDays?: number;
};

export function AgenceReventeCalculator({
  metrics,
  initialClosingRate = 20,
  initialCapacityDays = 5,
}: AgenceReventeCalculatorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculateur RDV pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <PipelineCalculatorCore
          metrics={metrics}
          initialClosingRate={initialClosingRate}
          initialCapacityDays={initialCapacityDays}
          variant="full"
        />
      </CardContent>
    </Card>
  );
}

export type { PipelineCalculatorResult };
