"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { computePipelineRoi } from "@/lib/calendly/pipeline-roi-calculator";
import {
  PIPELINE_CLOSING_RATE_OPTIONS,
  PIPELINE_HIGH_CLOSING_TIMELINES,
  PIPELINE_ROI_BASKET_EUR,
  PIPELINE_ROI_CALL_MODELS,
  PIPELINE_ROI_CLOSING_RATE,
  PIPELINE_ROI_MEETING_DURATIONS,
  PIPELINE_ROI_PERSONALITY_OPTIONS,
  PIPELINE_ROI_RDV_PER_MONTH,
  closingTimelineLabel,
  coercePipelineClientCount,
  rdvPerMonthToCapacityDays,
  roiCallModelLabel,
  type PipelineQualificationInput,
} from "@/lib/calendly/pipeline-qualification-schema";

import type { AgenceReventeWizardValues } from "./agence-revente-wizard";

type AgenceReventeRoiStepProps = {
  values: AgenceReventeWizardValues;
  onPatch: (patch: Partial<AgenceReventeWizardValues>) => void;
};

function formatEuro(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function syncLegacyRoiFields(
  patch: Partial<AgenceReventeWizardValues>,
): Partial<AgenceReventeWizardValues> {
  const next = { ...patch };
  if (typeof next.roi_closing_rate === "number") {
    next.closing_rate_min = next.roi_closing_rate;
  }
  if (typeof next.roi_rdv_per_month === "number") {
    next.capacity_days_per_month = rdvPerMonthToCapacityDays(next.roi_rdv_per_month);
  }
  return next;
}

export function AgenceReventeRoiStep({ values, onPatch }: AgenceReventeRoiStepProps) {
  const roi = useMemo(
    () =>
      computePipelineRoi({
        roi_call_model: values.roi_call_model,
        roi_rdv_per_month: values.roi_rdv_per_month,
        roi_meeting_duration: values.roi_meeting_duration,
        roi_closing_rate: values.roi_closing_rate,
        roi_basket_eur: values.roi_basket_eur,
      }),
    [
      values.roi_basket_eur,
      values.roi_call_model,
      values.roi_closing_rate,
      values.roi_meeting_duration,
      values.roi_rdv_per_month,
    ],
  );

  const maxBar = Math.max(...roi.bars.map((bar) => bar.valueEur), 1);
  const showHighClosing = values.roi_closing_rate > 20;

  function patchRoi(patch: Partial<PipelineQualificationInput>) {
    onPatch(syncLegacyRoiFields(patch));
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Basé sur {PIPELINE_ROI_RDV_PER_MONTH.default} rendez-vous mensuels par défaut
        — ajustez les curseurs pour projeter votre ROI.
      </p>

      <div className="space-y-2">
        <Label>Modèle commercial</Label>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_ROI_CALL_MODELS.map((model) => (
            <Button
              key={model}
              type="button"
              variant={values.roi_call_model === model ? "default" : "outline"}
              onClick={() => patchRoi({ roi_call_model: model })}
            >
              {roiCallModelLabel(model)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>
          Actuellement, combien de RDV pouvez-vous traiter par mois ? —{" "}
          {values.roi_rdv_per_month}
        </Label>
        <Slider
          min={PIPELINE_ROI_RDV_PER_MONTH.min}
          max={PIPELINE_ROI_RDV_PER_MONTH.max}
          step={1}
          value={[values.roi_rdv_per_month]}
          onValueChange={(next) =>
            patchRoi({
              roi_rdv_per_month: coercePipelineClientCount(
                next[0],
                PIPELINE_ROI_RDV_PER_MONTH,
              ),
            })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{PIPELINE_ROI_RDV_PER_MONTH.min}</span>
          <span>{PIPELINE_ROI_RDV_PER_MONTH.max}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Durée d&apos;un rendez-vous</Label>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_ROI_MEETING_DURATIONS.map((duration) => (
            <Button
              key={duration}
              type="button"
              variant={
                values.roi_meeting_duration === duration ? "default" : "outline"
              }
              onClick={() => patchRoi({ roi_meeting_duration: duration })}
            >
              {duration === "30min" ? "30 min" : "1 h"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Profils clients du pipeline</Label>
        <div className="space-y-2">
          {PIPELINE_ROI_PERSONALITY_OPTIONS.map((option) => (
            <Field
              key={option.field}
              orientation="horizontal"
              className="items-start gap-3 rounded-lg border border-border p-3"
            >
              <Checkbox
                id={option.field}
                checked={values[option.field]}
                onCheckedChange={(checked) =>
                  patchRoi({ [option.field]: checked === true })
                }
              />
              <FieldLabel htmlFor={option.field} className="font-normal leading-snug">
                <span className="font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              </FieldLabel>
            </Field>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>
          Taux de closing — {values.roi_closing_rate} %
          <span className="block text-xs font-normal text-muted-foreground">
            Leads ayant annoncé budget, désir de croissance mensuelle et problème
            ciblé
          </span>
        </Label>
        <Slider
          min={PIPELINE_ROI_CLOSING_RATE.min}
          max={PIPELINE_ROI_CLOSING_RATE.max}
          step={5}
          value={[values.roi_closing_rate]}
          onValueChange={(next) =>
            patchRoi({
              roi_closing_rate: coercePipelineClientCount(
                next[0],
                PIPELINE_ROI_CLOSING_RATE,
              ),
            })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {PIPELINE_CLOSING_RATE_OPTIONS.map((rate) => (
            <span key={rate}>{rate} %</span>
          ))}
        </div>
      </div>

      {showHighClosing ? (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm text-muted-foreground">
            Taux de closing élevé — 2 questions de qualification supplémentaires.
            {/* Extension future : +3 questions si besoin */}
          </p>
          <div className="space-y-2">
            <Label>Quel service visez-vous ?</Label>
            <Textarea
              rows={3}
              value={values.high_closing_service}
              onChange={(event) =>
                patchRoi({ high_closing_service: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Délai pour des résultats tangibles</Label>
            <div className="flex flex-wrap gap-2">
              {PIPELINE_HIGH_CLOSING_TIMELINES.map((timeline) => (
                <Button
                  key={timeline}
                  type="button"
                  variant={
                    values.high_closing_timeline === timeline ? "default" : "outline"
                  }
                  onClick={() => patchRoi({ high_closing_timeline: timeline })}
                >
                  {closingTimelineLabel(timeline)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <Label>
          Panier moyen service — {formatEuro(values.roi_basket_eur)}
        </Label>
        <Slider
          min={PIPELINE_ROI_BASKET_EUR.min}
          max={PIPELINE_ROI_BASKET_EUR.max}
          step={PIPELINE_ROI_BASKET_EUR.step}
          value={[values.roi_basket_eur]}
          onValueChange={(next) =>
            patchRoi({
              roi_basket_eur: coercePipelineClientCount(
                next[0],
                PIPELINE_ROI_BASKET_EUR,
              ),
            })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatEuro(PIPELINE_ROI_BASKET_EUR.min)}</span>
          <span>{formatEuro(PIPELINE_ROI_BASKET_EUR.max)}</span>
        </div>
      </div>

      <Card className="bg-muted/20">
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">RDV effectifs / mois</p>
              <p className="text-xl font-semibold">
                {formatNumber(roi.effectiveRdvPerMonth, 1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signatures / mois</p>
              <p className="text-xl font-semibold">
                {formatNumber(roi.signedPerMonth, 1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ratio vs coût pipeline</p>
              <p className="text-xl font-semibold">
                {formatNumber(roi.roiRatio, 1)}×
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {roi.bars.map((bar) => (
              <div
                key={bar.id}
                className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center"
              >
                <span className="text-xs text-muted-foreground">{bar.label}</span>
                <div className="h-2.5 overflow-hidden rounded-full border border-border bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(bar.valueEur / maxBar) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums">
                  {formatEuro(bar.valueEur)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label>Ce ROI correspond-il à vos objectifs ?</Label>
        <div className="space-y-2">
          <Field
            orientation="horizontal"
            className="items-start gap-3 rounded-lg border border-border p-3"
          >
            <Checkbox
              id="roi_matches_yes"
              checked={values.roi_matches_objective === "yes"}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  patchRoi({ roi_matches_objective: "yes" });
                  return;
                }
                if (values.roi_matches_objective === "yes") {
                  onPatch({ roi_matches_objective: undefined });
                }
              }}
            />
            <FieldLabel htmlFor="roi_matches_yes" className="font-normal leading-snug">
              Ce ROI correspond parfaitement à mes objectifs
            </FieldLabel>
          </Field>
          <Field
            orientation="horizontal"
            className="items-start gap-3 rounded-lg border border-border p-3"
          >
            <Checkbox
              id="roi_matches_no"
              checked={values.roi_matches_objective === "no"}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  patchRoi({ roi_matches_objective: "no" });
                  return;
                }
                if (values.roi_matches_objective === "no") {
                  onPatch({ roi_matches_objective: undefined });
                }
              }}
            />
            <FieldLabel htmlFor="roi_matches_no" className="font-normal leading-snug">
              Non, ce ROI ne correspond pas à mes objectifs
            </FieldLabel>
          </Field>
        </div>
      </div>
    </div>
  );
}
