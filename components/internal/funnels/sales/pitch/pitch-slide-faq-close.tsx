"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { memo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  getPitchP11WhyOptions,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";

import { SalesSingleChoiceField } from "../sales-question-fields";
import { PITCH_FAQ_ITEMS, PITCH_P11_TEMP_OPTIONS } from "../sales-pitch-wizard-slides";
import { ChoiceTiles } from "./pitch-primitives";
import { pitchSingleQuestion } from "./pitch-utils";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

function truncateFaqBody(body: string, maxSentences = 2): string {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(" ");
}

export const PitchSlideFaqClose = memo(function PitchSlideFaqClose({
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

  return (
    <div className="flex flex-col gap-5">
      <Accordion type="single" collapsible className="w-full">
        {PITCH_FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-sm">{item.title}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {truncateFaqBody(interpolate(item.body))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

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
