"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { memo, useState } from "react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  getPitchP11WhyOptions,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { PITCH_FAQ_COMPACT_ITEMS } from "@/lib/admin/funnels/sales-pitch-triptych-copy";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { cn } from "@/lib/utils";

import { SalesSingleChoiceField } from "../sales-question-fields";
import { PITCH_P11_TEMP_OPTIONS } from "../sales-pitch-wizard-slides";
import { ChoiceTiles, GlowCard } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import { pitchSingleQuestion } from "./pitch-utils";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideFaqClose = memo(function PitchSlideFaqClose({
  slide,
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const tempPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Solution adaptée pour {goal6m} ?"
    : "Bonne solution pour {goal6m} ?";
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        {PITCH_FAQ_COMPACT_ITEMS.map((item) => {
          const isActive = activeFaqId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveFaqId(isActive ? null : item.id)}
              className="text-left"
            >
              <GlowCard
                variant={isActive ? "primary" : "default"}
                className={cn("h-full transition-colors", isActive && "ring-1 ring-primary")}
              >
                <p className="text-sm font-medium">{item.title}</p>
                {isActive ? (
                  <p className="text-xs text-muted-foreground">{interpolate(item.body)}</p>
                ) : null}
              </GlowCard>
            </button>
          );
        })}
      </div>

      <FormField
        control={form.control}
        name="p11TempCheck"
        render={({ field }) => (
          <FormItem>
            <ChoiceTiles
              name="p11TempCheck"
              prompt={interpolate(tempPrompt)}
              value={field.value ?? ""}
              onChange={field.onChange}
              options={[
                {
                  id: PITCH_P11_TEMP_OPTIONS[0].id,
                  label: PITCH_P11_TEMP_OPTIONS[0].label,
                  icon: ThumbsUp,
                },
                {
                  id: PITCH_P11_TEMP_OPTIONS[1].id,
                  label: PITCH_P11_TEMP_OPTIONS[1].label,
                  icon: ThumbsDown,
                },
              ]}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      {values.p11TempCheck === "yes" ? (
        <FormField
          control={form.control}
          name="p11WhyId"
          render={({ field }) => (
            <FormItem>
              <SalesSingleChoiceField
                question={pitchSingleQuestion(
                  "p11WhyId",
                  "Pourquoi Hercule ?",
                  getPitchP11WhyOptions(values, audience, context),
                )}
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
