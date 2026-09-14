"use client";

import { Check } from "lucide-react";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getPitchP12WhyOptions,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { buildPitchRoiModel, formatPitchRoiCompactSummary } from "@/lib/admin/funnels/sales-pitch-roi";
import {
  FOUNDATION_PRICING_PLANS,
  formatFoundationEuros,
} from "@/lib/commercial/constants";
import { cn } from "@/lib/utils";

import { SalesSingleChoiceField } from "../sales-question-fields";
import { PitchRoiMetricStrip } from "./pitch-primitives";
import { pitchSingleQuestion } from "./pitch-utils";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlidePricing = memo(function PitchSlidePricing({
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const roiModel = useMemo(() => buildPitchRoiModel(values, audience), [audience, values]);
  const roiSummary = formatPitchRoiCompactSummary(roiModel);
  const p12WhyOptions = getPitchP12WhyOptions(values.p12Plan, values, audience, context);
  const selectedPlan = values.p12Plan;
  const horizonPlan = FOUNDATION_PRICING_PLANS.find((plan) => plan.id === "horizon");
  const corePlan = FOUNDATION_PRICING_PLANS.find((plan) => plan.id === "core");
  const highlightFeatures =
    selectedPlan === "core"
      ? corePlan?.features ?? []
      : horizonPlan?.features ?? [];

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={form.control}
        name="p12Plan"
        render={({ field }) => (
          <FormItem>
            <RadioGroup
              value={field.value ?? ""}
              onValueChange={(next) => {
                if (field.value && field.value !== next) {
                  form.setValue("p12WhyId", undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
                field.onChange(next);
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              {FOUNDATION_PRICING_PLANS.map((plan) => {
                const inputId = `p12-plan-${plan.id}`;
                const isSelected = field.value === plan.id;
                return (
                  <FieldLabel
                    key={plan.id}
                    htmlFor={inputId}
                    className={cn(
                      "block cursor-pointer rounded-lg border bg-card transition-colors hover:border-primary/50 hover:bg-primary/5",
                      isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border",
                    )}
                  >
                    <Card className="border-0 bg-transparent shadow-none">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value={plan.id} id={inputId} className="mt-1" />
                            <CardTitle className="text-base">{plan.name}</CardTitle>
                          </div>
                          {plan.recommended ? (
                            <Badge variant="secondary" className="shrink-0 text-[10px]">
                              Recommandé
                            </Badge>
                          ) : null}
                        </div>
                        <CardDescription>{plan.tagline}</CardDescription>
                        <p className="pt-1 text-2xl font-medium tracking-tight">
                          {formatFoundationEuros(plan.priceCents)}
                          <span className="text-sm font-normal text-muted-foreground">/mois</span>
                        </p>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <ul className="flex flex-col gap-2">
                          {plan.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </FieldLabel>
                );
              })}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedPlan && highlightFeatures.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {highlightFeatures.slice(0, 4).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature.split("—")[0]?.trim() ?? feature}
            </Badge>
          ))}
        </div>
      ) : null}

      <PitchRoiMetricStrip
        compact
        investment={roiSummary.investment}
        guarantee={roiSummary.guarantee}
        yearOne={roiSummary.yearOne}
      />

      {values.p12Plan ? (
        <FormField
          control={form.control}
          name="p12WhyId"
          render={({ field }) => (
            <FormItem>
              <SalesSingleChoiceField
                question={pitchSingleQuestion("p12WhyId", "Pourquoi ce plan ?", p12WhyOptions)}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
});
