"use client";

import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

import { SalesQualificationForm } from "./sales-qualification-form";
import type { SalesFunnelSection } from "./sales-funnel-sections";

const INTRO_BENEFITS = [
  "Des opportunités compatibles avec vos expertises et vos tarifs",
  "Moins de temps perdu sur des dossiers hors-profil",
  "Un scoring de compatibilité ajusté à votre capacité réelle",
  "Une relation durable fondée sur la transparence mutuelle",
] as const;

type SalesFunnelSectionPageProps = {
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesFunnelSectionPage({ section, form }: SalesFunnelSectionPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 text-left">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{section.title}</h1>
          {section.duration ? (
            <Badge variant="outline" className="font-normal">
              {section.duration}
            </Badge>
          ) : null}
        </div>
        {section.subtitle ? (
          <p className="text-xs leading-snug text-muted-foreground">{section.subtitle}</p>
        ) : null}
      </div>
      {section.id === "introduction" ? (
        <ul className="space-y-2 text-sm text-muted-foreground">
          {INTRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <SalesQualificationForm section={section} form={form} />
    </div>
  );
}
