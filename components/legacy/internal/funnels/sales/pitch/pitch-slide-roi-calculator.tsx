"use client";

import { CalendarCheck, TrendingUp } from "lucide-react";
import { memo, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  FOUNDATION_ROI_ACK_LABEL,
} from "@/lib/legacy/admin/funnels/comptable-sales-copy";
import { CIF_FOUNDATION_ROI_ACK_LABEL } from "@/lib/legacy/admin/funnels/cif-sales-copy";
import { buildPitchRoiModel } from "@/lib/legacy/admin/funnels/sales-pitch-roi";
import { isCifSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";

import { GlowHero, MetricTile } from "./pitch-primitives";
import { PitchTriptych } from "./pitch-triptych";
import type { PitchSlideBaseProps } from "./pitch-slide-props";

export const PitchSlideRoiCalculator = memo(function PitchSlideRoiCalculator({
  slide,
  audience,
  form,
  values,
  context,
}: PitchSlideBaseProps) {
  const model = useMemo(() => buildPitchRoiModel(values, audience), [audience, values]);
  const isCif = isCifSalesAudience(audience);

  return (
    <div className="flex flex-col gap-4">
      <PitchTriptych
        stepId={slide.id}
        audience={audience}
        values={values}
        context={context}
      />
      <GlowHero
        value={model.bars[0]?.formatted ?? "—"}
        label={`RDV garantis / ${model.guaranteeWindowMonths} mois`}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricTile
          icon={CalendarCheck}
          value={model.bars[0]?.formatted ?? "—"}
          label="Garantie contractuelle"
          tone="primary"
          glow
        />
        <MetricTile
          icon={TrendingUp}
          value={model.bars[1]?.formatted ?? "—"}
          label="Valeur an 1"
          glow
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {model.honorairesLabel !== "—" ? (
          <Badge variant="outline">{model.honorairesLabel}</Badge>
        ) : null}
        {model.gapLabel ? <Badge variant="outline">Écart · {model.gapLabel}</Badge> : null}
        {model.cause ? (
          <Badge variant="outline" className="max-w-xs truncate">
            {model.cause}
          </Badge>
        ) : null}
      </div>

      <FormField
        control={form.control}
        name="pRoiAcknowledged"
        render={({ field }) => (
          <FormItem>
            <Field orientation="horizontal">
              <Checkbox
                id="pRoiAcknowledged"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="pRoiAcknowledged" className="text-sm font-normal leading-relaxed">
                {isCif ? CIF_FOUNDATION_ROI_ACK_LABEL : FOUNDATION_ROI_ACK_LABEL}
              </FieldLabel>
            </Field>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
