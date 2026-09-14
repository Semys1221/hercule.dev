"use client";

import Link from "next/link";
import { Clock, Shield, Zap } from "lucide-react";
import { memo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PITCH_CGV_COMPACT_HIGHLIGHTS } from "@/lib/admin/funnels/sales-pitch-triptych-copy";

import {
  getPitchCgvHref,
  getPitchCgvLabel,
} from "../sales-pitch-wizard-slides";
import { GlowCard } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const CGV_ICONS = [Shield, Clock, Zap] as const;

export const PitchSlideCgv = memo(function PitchSlideCgv({
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
      <div className="grid gap-3 sm:grid-cols-3">
        {PITCH_CGV_COMPACT_HIGHLIGHTS.map((item, index) => {
          const Icon = CGV_ICONS[index] ?? Shield;
          return (
            <GlowCard key={item.title} variant={index === 0 ? "primary" : "default"}>
              <div className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </GlowCard>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        <Link href={getPitchCgvHref(audience)} className="underline underline-offset-4">
          {getPitchCgvLabel(audience)}
        </Link>
      </p>
      <FormField
        control={form.control}
        name="pCgvAccepted"
        render={({ field }) => (
          <FormItem>
            <Field orientation="horizontal">
              <Checkbox
                id="pCgvAccepted"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="pCgvAccepted" className="text-sm font-normal leading-relaxed">
                Le cabinet valide le cadre et souhaite déployer Foundation sur sa zone.
              </FieldLabel>
            </Field>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
