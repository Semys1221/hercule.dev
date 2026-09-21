"use client";

import { Building2, KeyRound, Megaphone, Search, Shield } from "lucide-react";
import { memo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";

import { GlowCard, IconChipGrid } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const RENTAL_ITEMS = [
  { icon: Search, label: "SEO" },
  { icon: Megaphone, label: "Pub" },
  { icon: Building2, label: "Location" },
] as const;

const ASSET_ITEMS = [
  { icon: Shield, label: "Zone verrouillée" },
  { icon: KeyRound, label: "Infrastructure" },
  { icon: Building2, label: "Actif cabinet" },
] as const;

export const PitchSlideDifferentiation = memo(function PitchSlideDifferentiation({
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
      <div className="grid gap-3 md:grid-cols-2">
        <GlowCard variant="destructive">
          <p className="text-sm font-medium text-destructive">Location</p>
          <IconChipGrid items={RENTAL_ITEMS} tone="destructive" />
        </GlowCard>
        <GlowCard variant="primary">
          <p className="text-sm font-medium text-primary">Actif</p>
          <IconChipGrid items={ASSET_ITEMS} tone="primary" />
        </GlowCard>
      </div>

      <FormField
        control={form.control}
        name="p3Acknowledged"
        render={({ field }) => (
          <FormItem>
            <Field orientation="horizontal">
              <Checkbox
                id="p3Acknowledged"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="p3Acknowledged" className="text-sm font-normal">
                Le cabinet valide ce constat.
              </FieldLabel>
            </Field>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
