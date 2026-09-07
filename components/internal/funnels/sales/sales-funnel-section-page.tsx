"use client";

import type { UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { RESERVATION_BODY_TEXT } from "@/lib/admin/funnels/reservation-surface";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

import { SalesIntroSection } from "./sales-intro-section";
import { SalesQualificationForm } from "./sales-qualification-form";
import type { SalesFunnelSection } from "./sales-funnel-sections";

type SalesFunnelSectionPageProps = {
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesFunnelSectionPage({ section, form }: SalesFunnelSectionPageProps) {
  if (section.id === "introduction") {
    return <SalesIntroSection section={section} form={form} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 text-left">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-medium tracking-tight">{section.title}</h1>
          {section.duration ? (
            <Badge variant="outline" className="font-normal">
              {section.duration}
            </Badge>
          ) : null}
        </div>
        {section.subtitle ? (
          <p className={RESERVATION_BODY_TEXT}>{section.subtitle}</p>
        ) : null}
      </div>
      <SalesQualificationForm section={section} form={form} />
    </div>
  );
}
