"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import type { Audience } from "@/lib/legacy/admin/navigation";
import { RESERVATION_BODY_TEXT } from "@/lib/legacy/admin/funnels/reservation-surface";
import { isCabinetBuyerSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";
import { resolveBleedSectionSubtitle } from "@/lib/legacy/admin/funnels/sales-bleed-track";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import { AGENCE_OBJECTIFS_SUBTITLE } from "@/components/legacy/internal/funnels/sales/sales-questions-objectifs-agence";
import { CABINET_OBJECTIFS_SUBTITLE } from "@/components/legacy/internal/funnels/sales/sales-questions-objectifs-comptable";
import { ENTREPRISE_OBJECTIFS_SUBTITLE } from "@/components/legacy/internal/funnels/sales/sales-questions-objectifs-entreprise";

import { SalesIntroSection } from "./sales-intro-section";
import { SalesQualificationForm } from "./sales-qualification-form";
import type { SalesFunnelSection } from "./sales-funnel-sections";

type SalesFunnelSectionPageProps = {
  audience: Audience;
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
  prospectFirstName?: string;
};

export function SalesFunnelSectionPage({
  audience,
  section,
  form,
  prospectFirstName,
}: SalesFunnelSectionPageProps) {
  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
    audience,
  );

  if (section.id === "introduction") {
    return <SalesIntroSection audience={audience} section={section} form={form} />;
  }

  const bleedSubtitle = resolveBleedSectionSubtitle(section.id, audience, watchedValues);
  const subtitle =
    bleedSubtitle ??
    (section.id === "objectifs"
      ? isCabinetBuyerSalesAudience(audience)
        ? CABINET_OBJECTIFS_SUBTITLE
        : audience === "agence"
          ? AGENCE_OBJECTIFS_SUBTITLE
          : audience === "entreprise"
            ? ENTREPRISE_OBJECTIFS_SUBTITLE
            : section.subtitle
      : section.subtitle);

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
        {subtitle ? (
          <p className={RESERVATION_BODY_TEXT}>{subtitle}</p>
        ) : null}
      </div>
      <SalesQualificationForm
        audience={audience}
        section={section}
        form={form}
        prospectFirstName={prospectFirstName}
      />
    </div>
  );
}
