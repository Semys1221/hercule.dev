"use client";

import { Check, Clock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { interpolateClientSegment, resolveClientSegment } from "@/lib/admin/funnels/client-segment";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import { SalesConfirmationCard } from "./sales-confirmation-card";
import { getIntroConfirmationText, type SalesFunnelSection } from "./sales-funnel-sections";

const INTRO_BENEFITS = [
  "Des opportunités compatibles avec vos expertises et vos tarifs",
  "Moins de temps perdu sur des dossiers hors-profil",
  "Un scoring de compatibilité ajusté à votre capacité réelle",
  "Une relation durable fondée sur la transparence mutuelle",
] as const;

const COMPTABLE_INTRO_BENEFITS = [
  "Des missions {clientSegment} compatibles avec vos expertises et vos honoraires",
  "Moins de temps perdu sur des dossiers hors-profil",
  "Un scoring de compatibilité ajusté à votre capacité réelle",
  "Une relation durable fondée sur la transparence mutuelle",
] as const;

type SalesIntroSectionProps = {
  audience: Audience;
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesIntroSection({ audience, section, form }: SalesIntroSectionProps) {
  const watchedQ11 = useWatch({ control: form.control, name: "q11" }) as string[] | undefined;
  const clientSegment = resolveClientSegment(watchedQ11 ?? []);
  const benefits =
    isCabinetBuyerSalesAudience(audience)
      ? COMPTABLE_INTRO_BENEFITS.map((item) => interpolateClientSegment(item, clientSegment))
      : INTRO_BENEFITS;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 text-left">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{section.title}</h1>
          {section.duration ? (
            <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {section.duration}
            </Badge>
          ) : null}
        </div>
        {section.subtitle ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>
        ) : null}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">Pourquoi cet audit</h2>
        <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
          <CardContent className="divide-y divide-border p-0">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 px-5 py-4 md:px-6 md:py-5"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted"
                  aria-hidden
                >
                  <Check className="size-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <FormField
        control={form.control}
        name="introConfirmed"
        render={({ field }) => (
          <FormItem>
            <SalesConfirmationCard
              id="sales-intro-confirmed"
              label={getIntroConfirmationText(audience, clientSegment)}
              description="Cette étape est requise avant de commencer la qualification."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
