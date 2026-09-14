"use client";

import { memo } from "react";

import {
  FOUNDATION_ACTIVATION_CLOCKS,
  FOUNDATION_DEPLOYMENT_PHASES,
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
  FOUNDATION_FOUNDATION_BLOCKS,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_ACTIVATION_CLOCKS,
  CIF_FOUNDATION_DEPLOYMENT_PHASES,
  CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
  CIF_FOUNDATION_FOUNDATION_BLOCKS,
} from "@/lib/admin/funnels/cif-sales-copy";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Field, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import {
  buildActivationDeploymentTimelineSteps,
  buildFoundationBlocksTimelineSteps,
  SalesPitchHorizontalTimeline,
} from "../sales-foundation-timeline";
import { PITCH_BUYIN_OPTIONS } from "../sales-pitch-wizard-slides";
import { DualClock, GlowCard, MilestoneStrip } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideFoundation = memo(function PitchSlideFoundation({
  slide,
  audience,
  form,
  values,
  immersive,
  context,
}: PitchSlideBaseProps) {
  const blocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_FOUNDATION_BLOCKS
    : FOUNDATION_FOUNDATION_BLOCKS;
  const phases = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_DEPLOYMENT_PHASES
    : FOUNDATION_DEPLOYMENT_PHASES;
  const clocks = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_ACTIVATION_CLOCKS
    : FOUNDATION_ACTIVATION_CLOCKS;
  const weeklyLines = isCifSalesAudience(audience)
    ? CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES
    : FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES;
  const foundationSteps = buildFoundationBlocksTimelineSteps(blocks);
  const activationSteps = buildActivationDeploymentTimelineSteps(phases, weeklyLines, clocks);
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Déploiement 60 j + garantie 90 j — c'est clair pour le cabinet ?"
    : "Déploiement 60 j + garantie 90 j — c'est clair ?";

  const handleEngineBuyIn = (value: string) => {
    form.setValue("p7FoundationBuyIn", value as "clear" | "questions", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("p7BuyIn", value as "clear" | "questions", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const engineBuyInValue = values.p7BuyIn ?? values.p7FoundationBuyIn ?? "";

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <MilestoneStrip
        milestones={[
          { label: "J+0", detail: "Fondations" },
          { label: "J+60", detail: "Système live" },
          { label: "J+150", detail: "20 RDV ✓" },
        ]}
      />
      <DualClock
        leftLabel="Déploiement live"
        leftValue={60}
        leftMax={60}
        rightLabel="Fenêtre garantie"
        rightValue={90}
        rightMax={90}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((block) => (
          <GlowCard key={block.id}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {block.month}
            </p>
            <p className="text-sm font-medium">{block.title}</p>
          </GlowCard>
        ))}
      </div>
      <SalesPitchHorizontalTimeline
        immersive={immersive}
        steps={[...foundationSteps.slice(0, 2), ...activationSteps.slice(-1)]}
        activeStatusLabel="Engine"
      />
      <FormField
        control={form.control}
        name="p7BuyIn"
        render={() => (
          <FormItem>
            <p className="text-sm font-medium">{buyInPrompt}</p>
            <RadioGroup
              value={engineBuyInValue}
              onValueChange={handleEngineBuyIn}
              className="grid gap-3 sm:grid-cols-2"
            >
              {PITCH_BUYIN_OPTIONS.map((option) => {
                const inputId = `p7-engine-${option.id}`;
                const isSelected = engineBuyInValue === option.id;
                return (
                  <FieldLabel
                    key={option.id}
                    htmlFor={inputId}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-[0_0_20px_-4px_hsl(var(--primary)/0.2)]"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <RadioGroupItem value={option.id} id={inputId} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </FieldLabel>
                );
              })}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
