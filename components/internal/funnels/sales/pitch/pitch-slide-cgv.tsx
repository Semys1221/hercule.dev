"use client";

import Link from "next/link";
import { BadgeEuro, Clock, Percent, Shield, Zap } from "lucide-react";
import { memo } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  FOUNDATION_INBOUND_SLA_RULE,
} from "@/lib/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_INBOUND_SLA_RULE } from "@/lib/admin/funnels/cif-sales-copy";
import { PITCH_CGV_GUARANTEE_HOOK_TEMPLATE } from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import { formatPitchWizardInterpolation } from "@/lib/admin/funnels/sales-pitch-wizard";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";

import {
  getPitchCgvHref,
  getPitchCgvLabel,
  PITCH_CGV_HIGHLIGHTS,
} from "../sales-pitch-wizard-slides";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

const CGV_ICONS = [Shield, Clock, BadgeEuro, Percent, Zap] as const;

export const PitchSlideCgv = memo(function PitchSlideCgv({
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const isCif = isCifSalesAudience(audience);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {PITCH_CGV_HIGHLIGHTS.map((item, index) => {
          const Icon = CGV_ICONS[index] ?? Shield;
          return (
            <li
              key={item.title}
              className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium text-foreground">{item.title}</span>
                <span className="text-muted-foreground">{item.description}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">
        {interpolate(PITCH_CGV_GUARANTEE_HOOK_TEMPLATE)}
      </p>
      <p className="text-sm text-muted-foreground">
        <Link href={getPitchCgvHref(audience)} className="underline underline-offset-4">
          {getPitchCgvLabel(audience)}
        </Link>
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {interpolate(isCif ? CIF_FOUNDATION_INBOUND_SLA_RULE : FOUNDATION_INBOUND_SLA_RULE)}
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
                Le cabinet confirme avoir pris connaissance des {getPitchCgvLabel(audience)},
                comprend que l&apos;activation et le paiement se font pendant cette session
                d&apos;audit, et souhaite déployer le Moteur Hercule Foundation sur la zone du
                cabinet.
              </FieldLabel>
            </Field>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
