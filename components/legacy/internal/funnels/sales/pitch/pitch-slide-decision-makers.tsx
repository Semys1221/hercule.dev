"use client";

import { UserX, Users } from "lucide-react";
import { memo } from "react";

import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { getPitchP2MissingRoleOptions } from "@/lib/legacy/admin/funnels/sales-pitch-bleed-copy";

import { SalesSingleChoiceField } from "../sales-question-fields";
import { PITCH_P2_PROMPT, PITCH_P2_OPTIONS } from "../sales-pitch-wizard-slides";
import { ChoiceTiles } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import { pitchSingleQuestion } from "./pitch-utils";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideDecisionMakers = memo(function PitchSlideDecisionMakers({
  slide,
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <FormField
        control={form.control}
        name="p2DecisionMakers"
        render={({ field }) => (
          <FormItem>
            <ChoiceTiles
              name="p2DecisionMakers"
              prompt={PITCH_P2_PROMPT}
              value={field.value ?? ""}
              onChange={field.onChange}
              options={[
                { id: PITCH_P2_OPTIONS[0].id, label: PITCH_P2_OPTIONS[0].label, icon: Users },
                { id: PITCH_P2_OPTIONS[1].id, label: PITCH_P2_OPTIONS[1].label, icon: UserX },
              ]}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      {values.p2DecisionMakers === "missing" ? (
        <FormField
          control={form.control}
          name="p2MissingRole"
          render={({ field }) => (
            <FormItem>
              <SalesSingleChoiceField
                question={pitchSingleQuestion(
                  "p2MissingRole",
                  "Qui manque ?",
                  getPitchP2MissingRoleOptions(audience),
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
