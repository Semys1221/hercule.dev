"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import type { Audience } from "@/lib/admin/navigation";
import { RESERVATION_BODY_TEXT } from "@/lib/admin/funnels/reservation-surface";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { resolveBleedSectionSubtitle } from "@/lib/admin/funnels/sales-bleed-track";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { PITCH_WIZARD_SUBTITLE } from "@/lib/admin/funnels/sales-pitch-wizard";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import { AGENCE_OBJECTIFS_SUBTITLE } from "@/components/internal/funnels/sales/sales-questions-objectifs-agence";
import { SalesObjectifsWizard } from "@/components/internal/funnels/sales/sales-objectifs-wizard";
import { SalesPitchWizard } from "@/components/internal/funnels/sales/sales-pitch-wizard";
import { WIZARD_OBJECTIFS_SUBTITLE } from "@/components/internal/funnels/sales/sales-questions-objectifs-wizard";
import { ENTREPRISE_OBJECTIFS_SUBTITLE } from "@/components/internal/funnels/sales/sales-questions-objectifs-entreprise";

import { SalesIntroSection } from "./sales-intro-section";
import { SalesQualificationForm } from "./sales-qualification-form";
import type { SalesFunnelSection } from "./sales-funnel-sections";

type SalesFunnelSectionPageProps = {
  audience: Audience;
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
  prospectFirstName?: string;
  developerModeEnabled?: boolean;
  selectedLead?: LinkTrackingLead | null;
  selectedBooking?: EnrichedCalendlyBooking | null;
  onRefreshLead?: () => Promise<void>;
  immersiveCabinetWizard?: boolean;
  onOpenSidebar?: () => void;
  onGoToObjectifs?: () => void;
};

export function SalesFunnelSectionPage({
  audience,
  section,
  form,
  prospectFirstName,
  developerModeEnabled = false,
  selectedLead = null,
  selectedBooking = null,
  onRefreshLead,
  immersiveCabinetWizard = false,
  onOpenSidebar,
  onGoToObjectifs,
}: SalesFunnelSectionPageProps) {
  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
    audience,
  );

  const useObjectifsWizard =
    section.id === "objectifs" && isCabinetBuyerSalesAudience(audience);
  const usePitchWizard = section.id === "pitch" && isCabinetBuyerSalesAudience(audience);
  const useWizardShell = useObjectifsWizard || usePitchWizard;

  if (section.id === "introduction") {
    return <SalesIntroSection audience={audience} section={section} form={form} />;
  }

  const bleedSubtitle = resolveBleedSectionSubtitle(section.id, audience, watchedValues);
  const subtitle =
    bleedSubtitle ??
    (section.id === "objectifs"
      ? isCabinetBuyerSalesAudience(audience)
        ? WIZARD_OBJECTIFS_SUBTITLE
        : audience === "agence"
          ? AGENCE_OBJECTIFS_SUBTITLE
          : audience === "entreprise"
            ? ENTREPRISE_OBJECTIFS_SUBTITLE
            : section.subtitle
      : section.id === "pitch"
        ? PITCH_WIZARD_SUBTITLE
        : section.subtitle);

  if (useObjectifsWizard && immersiveCabinetWizard) {
    return (
      <SalesObjectifsWizard
        audience={audience}
        form={form}
        immersive
        onOpenSidebar={onOpenSidebar}
      />
    );
  }

  if (usePitchWizard && immersiveCabinetWizard) {
    return (
      <SalesPitchWizard
        audience={audience}
        form={form}
        immersive
        onOpenSidebar={onOpenSidebar}
        prospectFirstName={prospectFirstName}
        developerModeEnabled={developerModeEnabled}
        selectedLead={selectedLead}
        selectedBooking={selectedBooking}
        onRefreshLead={onRefreshLead}
        onGoToObjectifs={onGoToObjectifs}
      />
    );
  }

  return (
    <div
      className={`mx-auto w-full space-y-5 text-left ${
        useWizardShell ? "max-w-6xl" : "max-w-3xl"
      }`}
    >
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
      {useObjectifsWizard ? (
        <SalesObjectifsWizard audience={audience} form={form} />
      ) : usePitchWizard ? (
        <SalesPitchWizard
          audience={audience}
          form={form}
          prospectFirstName={prospectFirstName}
          developerModeEnabled={developerModeEnabled}
          selectedLead={selectedLead}
          selectedBooking={selectedBooking}
          onRefreshLead={onRefreshLead}
          onGoToObjectifs={onGoToObjectifs}
        />
      ) : (
        <SalesQualificationForm
          audience={audience}
          section={section}
          form={form}
          prospectFirstName={prospectFirstName}
        />
      )}
    </div>
  );
}
