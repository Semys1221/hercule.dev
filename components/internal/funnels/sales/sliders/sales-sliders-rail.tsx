"use client";

import { memo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  areSlidersThinkBeatsComplete,
  getSlidersHudLines,
  SLIDERS_THINK_BEATS,
  type SlidersSlideDefinition,
} from "@/lib/admin/funnels/sales-sliders";
import {
  getPitchP2MissingRoleOptions,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import type { PitchInterpolationContext } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

import { PITCH_P2_OPTIONS } from "../sales-pitch-wizard-slides";
import { SalesSingleChoiceField } from "../sales-question-fields";
import { pitchSingleQuestion } from "../pitch/pitch-utils";
import { GlowCard } from "../pitch/pitch-primitives";

type SalesSlidersRailProps = {
  slide: SlidersSlideDefinition;
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  onResetThinkFlow: () => void;
};

export const SalesSlidersRail = memo(function SalesSlidersRail({
  slide,
  audience,
  form,
  values,
  context,
  onResetThinkFlow,
}: SalesSlidersRailProps) {
  const hudLines = getSlidersHudLines(slide.id, values, audience, context);
  const showThinkWidget = slide.type === "temp" && values.sTempCheck === "think";
  const thinkComplete = areSlidersThinkBeatsComplete(values);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Anti-sèche (vous seul)
        </p>
        <GlowCard className="gap-2">
          {hudLines.map((line) => (
            <p key={line} className="text-xs leading-relaxed text-muted-foreground">{line}</p>
          ))}
        </GlowCard>
      </div>

      {slide.type === "deciders" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Décideurs</p>
          <RadioGroup
            value={values.p2DecisionMakers ?? ""}
            onValueChange={(next) =>
              form.setValue("p2DecisionMakers", next as "all_present" | "missing", {
                shouldDirty: true,
              })
            }
            className="grid gap-2"
          >
            {PITCH_P2_OPTIONS.map((option) => {
              const inputId = `sliders-p2-${option.id}`;
              return (
                <FieldLabel
                  key={option.id}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
                >
                  <RadioGroupItem value={option.id} id={inputId} />
                  <span className="text-sm">{option.label}</span>
                </FieldLabel>
              );
            })}
          </RadioGroup>
          {values.p2DecisionMakers === "missing" ? (
            <SalesSingleChoiceField
              question={pitchSingleQuestion(
                "p2MissingRole",
                "Qui manque ?",
                getPitchP2MissingRoleOptions(audience),
              )}
              value={values.p2MissingRole ?? ""}
              onChange={(next) =>
                form.setValue("p2MissingRole", next as SalesQualificationValues["p2MissingRole"], {
                  shouldDirty: true,
                })
              }
            />
          ) : null}
        </div>
      ) : null}

      {slide.type === "capture" || slide.type === "engine" || slide.type === "partner" ? (
        <TieDownField
          id={`sliders-tie-${slide.type}`}
          label="Tie-down validé — « Pourquoi c'est important pour vous ? » (oral)"
          checked={
            slide.type === "capture"
              ? values.sCaptureTied === true
              : slide.type === "engine"
                ? values.sEngineTied === true
                : values.sPartnerTied === true
          }
          onCheckedChange={(checked) => {
            const field =
              slide.type === "capture"
                ? "sCaptureTied"
                : slide.type === "engine"
                  ? "sEngineTied"
                  : "sPartnerTied";
            form.setValue(field, checked === true, { shouldDirty: true });
          }}
        />
      ) : null}

      {slide.type === "temp" && !showThinkWidget ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Temp check</p>
          <RadioGroup
            value={values.sTempCheck ?? ""}
            onValueChange={(next) => {
              if (next === "think") {
                form.setValue("sThinkBeat1", false, { shouldDirty: true });
                form.setValue("sThinkBeat2", false, { shouldDirty: true });
                form.setValue("sThinkBeat3", false, { shouldDirty: true });
              }
              form.setValue("sTempCheck", next as "yes" | "think", { shouldDirty: true });
            }}
            className="grid gap-2"
          >
            <FieldLabel
              htmlFor="sliders-temp-yes"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
            >
              <RadioGroupItem value="yes" id="sliders-temp-yes" />
              <span className="text-sm">Oui — bonne solution</span>
            </FieldLabel>
            <FieldLabel
              htmlFor="sliders-temp-think"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
            >
              <RadioGroupItem value="think" id="sliders-temp-think" />
              <span className="text-sm">Je dois réfléchir</span>
            </FieldLabel>
          </RadioGroup>
          {values.sTempCheck === "yes" ? (
            <p className="text-xs text-muted-foreground">
              Demandez « pourquoi ? » à l&apos;oral avant de continuer.
            </p>
          ) : null}
        </div>
      ) : null}

      {showThinkWidget ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">Resell — 3 beats</p>
          {SLIDERS_THINK_BEATS.map((beat, index) => {
            const fieldName =
              index === 0 ? "sThinkBeat1" : index === 1 ? "sThinkBeat2" : "sThinkBeat3";
            const checked = values[fieldName] === true;
            const inputId = `sliders-think-${beat.id}`;
            return (
              <GlowCard key={beat.id} className={cn(checked && "border-primary/40")}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onCheckedChange={(next) =>
                      form.setValue(fieldName, next === true, { shouldDirty: true })
                    }
                  />
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={inputId} className="text-sm font-medium">{beat.title}</Label>
                    <p className="text-xs text-muted-foreground">{beat.caption}</p>
                    <p className="text-[11px] text-muted-foreground">Puis « pourquoi ? » à l&apos;oral</p>
                  </div>
                </div>
              </GlowCard>
            );
          })}
          {thinkComplete ? (
            <Button type="button" variant="outline" size="sm" onClick={onResetThinkFlow}>
              Retour au temp check
            </Button>
          ) : null}
        </div>
      ) : null}

      {slide.type === "offer" ? (
        <p className="text-xs text-muted-foreground">
          Cliquez une offre sur le canvas pour copier le lien de paiement. Demandez « pourquoi
          celle-là ? » à l&apos;oral.
          {isCabinetBuyerSalesAudience(audience) ? "" : ""}
        </p>
      ) : null}
    </div>
  );
});

function TieDownField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Field orientation="horizontal" className="items-start gap-3 rounded-lg border border-border p-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-sm leading-snug font-normal">{label}</Label>
    </Field>
  );
}
