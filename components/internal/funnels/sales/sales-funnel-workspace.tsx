"use client";

import type { UseFormReturn } from "react-hook-form";

import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { LiveTrackSection } from "@/lib/admin/funnels/sales-cabinet-live-track";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { SESSION_PHASE_QUALIFICATION } from "@/lib/admin/funnels/ui-copy";
import type { Audience } from "@/lib/admin/navigation";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { SalesCabinetLiveTrack } from "./sales-cabinet-live-track";
import { RendezVousPanel } from "./rendez-vous-panel";
import { SalesClosingPanel } from "./sales-closing-panel";
import type { SalesClosingSectionId, SalesClosingValues } from "./sales-closing-sections";
import { SalesCompanyPresentationPanel } from "./sales-company-presentation-panel";
import { SalesFunnelSectionPage } from "./sales-funnel-section-page";
import type { SalesFunnelSection, SalesFunnelSectionId } from "./sales-funnel-sections";
import { SalesMappingPanel } from "./sales-mapping-panel";
import { SalesSlidersDeck } from "./sliders/sales-sliders-deck";

type SalesFunnelWorkspaceProps = {
  audience: Audience;
  phase: "qualification" | "closing";
  activeQualificationId: SalesFunnelSectionId;
  activeClosingId: SalesClosingSectionId;
  activeQualificationSection: SalesFunnelSection | undefined;
  closingSections: Array<{ id: SalesClosingSectionId; label: string }>;
  form: UseFormReturn<SalesQualificationValues>;
  closingValues: SalesClosingValues;
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  salesCallId: string | null;
  sessionResetKey: number;
  developerModeEnabled: boolean;
  prospectFirstName: string;
  immersiveCabinetWizard?: boolean;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  onGoToObjectifs?: () => void;
  onLiveTrackSectionChange?: (section: LiveTrackSection) => void;
  onClosingChange: (patch: Partial<SalesClosingValues>) => void;
  onMeetingNameChange: (name: string) => void;
  onBookingSelect: (booking: EnrichedCalendlyBooking | null) => Promise<void>;
  onApplyTestPreset: (preset: {
    qualification: SalesQualificationValues;
    closing: SalesClosingValues;
  }) => void;
  onResetSession: () => void;
  onRefreshLead: () => Promise<void>;
  onPersistClosing: (closing: SalesClosingValues) => Promise<void>;
};

export function SalesFunnelWorkspace({
  audience,
  phase,
  activeQualificationId,
  activeClosingId,
  activeQualificationSection,
  closingSections,
  form,
  closingValues,
  selectedLead,
  selectedBooking,
  salesCallId,
  sessionResetKey,
  developerModeEnabled,
  prospectFirstName,
  immersiveCabinetWizard = false,
  onOpenSidebar,
  sidebarOpen = false,
  onGoToObjectifs,
  onLiveTrackSectionChange,
  onClosingChange,
  onMeetingNameChange,
  onBookingSelect,
  onApplyTestPreset,
  onResetSession,
  onRefreshLead,
  onPersistClosing,
}: SalesFunnelWorkspaceProps) {
  const headerLabel =
    phase === "closing"
      ? closingSections.find((section) => section.id === activeClosingId)?.label
      : activeQualificationSection?.label ?? SESSION_PHASE_QUALIFICATION;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {!immersiveCabinetWizard ? (
        <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:px-6">
          <p className="truncate text-sm text-muted-foreground">{headerLabel}</p>
        </header>
      ) : null}
      <div
        className={
          immersiveCabinetWizard
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "flex-1 overflow-auto p-3 md:p-4"
        }
      >
        {phase === "closing" ? (
          <SalesClosingPanel
            audience={audience}
            sectionId={activeClosingId}
            qualificationForm={form}
            closingValues={closingValues}
            onClosingChange={onClosingChange}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            salesCallId={salesCallId}
            developerMode={developerModeEnabled}
            onRefreshLead={onRefreshLead}
            onPersistClosing={onPersistClosing}
          />
        ) : activeQualificationId === "rendez-vous" ? (
          <RendezVousPanel
            audience={audience}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            hasSelectedBooking={selectedBooking !== null}
            sessionResetKey={sessionResetKey}
            onMeetingNameChange={onMeetingNameChange}
            onBookingSelect={onBookingSelect}
            onApplyTestPreset={onApplyTestPreset}
            onResetSession={onResetSession}
          />
        ) : activeQualificationId === "presentation-societe" ? (
          <SalesCompanyPresentationPanel
            audience={audience}
            form={form}
            prospectFirstName={prospectFirstName}
          />
        ) : activeQualificationId === "mapping" ? (
          <SalesMappingPanel audience={audience} />
        ) : immersiveCabinetWizard &&
          isCabinetBuyerSalesAudience(audience) &&
          (activeQualificationId === "objectifs" || activeQualificationId === "pitch") ? (
          <SalesCabinetLiveTrack
            key="cabinet-live-track"
            audience={audience}
            form={form}
            activeQualificationId={activeQualificationId}
            prospectFirstName={prospectFirstName}
            developerModeEnabled={developerModeEnabled}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            onRefreshLead={onRefreshLead}
            onOpenSidebar={onOpenSidebar}
            sidebarOpen={sidebarOpen}
            onActiveSectionChange={onLiveTrackSectionChange}
          />
        ) : activeQualificationId === "sliders" &&
          isCabinetBuyerSalesAudience(audience) ? (
          <SalesSlidersDeck
            key="sliders-deck"
            audience={audience}
            form={form}
            prospectFirstName={prospectFirstName}
            developerModeEnabled={developerModeEnabled}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            immersive={immersiveCabinetWizard}
            onOpenSidebar={onOpenSidebar}
            sidebarOpen={sidebarOpen}
          />
        ) : activeQualificationSection ? (
          <SalesFunnelSectionPage
            key={activeQualificationId}
            audience={audience}
            section={activeQualificationSection}
            form={form}
            prospectFirstName={prospectFirstName}
            developerModeEnabled={developerModeEnabled}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            immersiveCabinetWizard={immersiveCabinetWizard}
            onOpenSidebar={onOpenSidebar}
            sidebarOpen={sidebarOpen}
            onRefreshLead={onRefreshLead}
            onGoToObjectifs={onGoToObjectifs}
          />
        ) : null}
      </div>
    </div>
  );
}
