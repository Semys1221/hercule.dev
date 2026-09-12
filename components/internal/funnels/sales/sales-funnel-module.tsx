"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  getDeveloperModeEnabledServerSnapshot,
  getDeveloperModeEnabledSnapshot,
  getPitchSidebarEnabledServerSnapshot,
  getPitchSidebarEnabledSnapshot,
  subscribeDeveloperModeEnabled,
  subscribePitchSidebarEnabled,
} from "@/lib/admin/funnels/sales-funnel-settings";
import { resolveClientSegment } from "@/lib/admin/funnels/client-segment";
import {
  getSalesQualificationDefaultValues,
  getSalesQualificationProgress,
  isSalesQualificationComplete,
  isSalesSectionComplete,
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { sessionHubHref, pathToHref, type Audience } from "@/lib/admin/navigation";
import { SESSION_PHASE_QUALIFICATION } from "@/lib/admin/funnels/ui-copy";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { RendezVousPanel } from "./rendez-vous-panel";
import { SalesClosingPanel } from "./sales-closing-panel";
import {
  getSalesClosingSections,
  isSalesClosingSectionComplete,
  isSalesClosingSectionId,
  salesClosingDefaultValues,
  type SalesClosingSectionId,
  type SalesClosingValues,
} from "./sales-closing-sections";
import { SalesCompanyPresentationPanel } from "./sales-company-presentation-panel";
import { SalesFunnelSectionPage } from "./sales-funnel-section-page";
import {
  getSalesFunnelSection,
  getSalesFunnelSections,
  type SalesFunnelSectionId,
} from "./sales-funnel-sections";
import { SalesFunnelSidebar, type MeetingInfo } from "./sales-funnel-sidebar";

const DEFAULT_MEETING_NAME = "No meetings";
const SIDEBAR_TRANSITION_MS = 300;

type SidebarContentAnimation = "idle" | "exit" | "enter";
type SidebarContentPhase = "qualification" | "pitch";

type SalesFunnelShellProps = {
  audience: Audience;
};

export function SalesFunnelShell({ audience }: SalesFunnelShellProps) {
  const [meetingName, setMeetingName] = useState(DEFAULT_MEETING_NAME);
  const [phase, setPhase] = useState<"qualification" | "closing">("qualification");
  const [contentPhase, setContentPhase] = useState<SidebarContentPhase>("qualification");
  const [contentAnimation, setContentAnimation] =
    useState<SidebarContentAnimation>("idle");
  const [activeQualificationId, setActiveQualificationId] =
    useState<SalesFunnelSectionId>("rendez-vous");
  const [activeClosingId, setActiveClosingId] =
    useState<SalesClosingSectionId>("recap");
  const [selectedBooking, setSelectedBooking] = useState<EnrichedCalendlyBooking | null>(null);
  const [selectedLead, setSelectedLead] = useState<LinkTrackingLead | null>(null);
  const [salesCallId, setSalesCallId] = useState<string | null>(null);
  const [closingValues, setClosingValues] =
    useState<SalesClosingValues>(salesClosingDefaultValues);
  const [visitedClosingSectionIds, setVisitedClosingSectionIds] = useState<
    Set<SalesClosingSectionId>
  >(() => new Set());
  const [sessionResetKey, setSessionResetKey] = useState(0);

  const hasAutoTransitionedRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  const pitchSidebarEnabled = useSyncExternalStore(
    subscribePitchSidebarEnabled,
    () => getPitchSidebarEnabledSnapshot(audience),
    getPitchSidebarEnabledServerSnapshot,
  );
  const developerModeEnabled = useSyncExternalStore(
    subscribeDeveloperModeEnabled,
    () => getDeveloperModeEnabledSnapshot(audience),
    getDeveloperModeEnabledServerSnapshot,
  );

  const defaultQualificationValues = useMemo(
    () => getSalesQualificationDefaultValues(audience),
    [audience],
  );

  const form = useForm<SalesQualificationValues>({
    defaultValues: defaultQualificationValues,
    mode: "onChange",
  });

  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
    audience,
  );
  const clientSegment = useMemo(
    () => resolveClientSegment(watchedValues.q11),
    [watchedValues.q11],
  );

  const exitHref = sessionHubHref(audience);
  const settingsHref = useMemo(() => {
    const base = pathToHref([audience, "sales", "funnel", "settings"]);
    if (!selectedBooking) {
      return base;
    }
    return `${base}?inviteeUri=${encodeURIComponent(selectedBooking.invitee_uri)}`;
  }, [audience, selectedBooking]);
  const activeSectionId = phase === "closing" ? activeClosingId : activeQualificationId;

  const closingCompletionContext = useMemo(
    () => ({
      values: closingValues,
      visitedIds: visitedClosingSectionIds,
      activeClosingId,
    }),
    [activeClosingId, closingValues, visitedClosingSectionIds],
  );

  const closingSections = useMemo(
    () => getSalesClosingSections(audience, clientSegment),
    [audience, clientSegment],
  );

  const funnelSections = useMemo(
    () => getSalesFunnelSections(audience, clientSegment),
    [audience, clientSegment],
  );

  const completedSectionIds = useMemo(() => {
    const qualificationCompleted = funnelSections.filter((section) =>
      isSalesSectionComplete(section.id, watchedValues, audience),
    ).map((section) => section.id);

    const closingCompleted = closingSections.filter((section) =>
      isSalesClosingSectionComplete(section.id, closingCompletionContext, audience),
    ).map((section) => section.id);

    return [...qualificationCompleted, ...closingCompleted];
  }, [audience, closingCompletionContext, funnelSections, watchedValues]);

  const { progress, progressLabel } = useMemo(() => {
    if (phase === "closing") {
      const completed = closingSections.filter((section) =>
        isSalesClosingSectionComplete(section.id, closingCompletionContext, audience),
      ).length;
      const total = closingSections.length;
      return {
        progress: Math.round((completed / total) * 100),
        progressLabel: `${completed}/${total}`,
      };
    }

    const { completedSections, totalSections, percent } =
      getSalesQualificationProgress(watchedValues, audience);

    return {
      progress: percent,
      progressLabel: `${completedSections}/${totalSections}`,
    };
  }, [audience, closingCompletionContext, phase, watchedValues]);

  const canEnterClosing = isSalesQualificationComplete(watchedValues, audience);
  const activeQualificationSection = getSalesFunnelSection(
    activeQualificationId,
    audience,
    clientSegment,
  );

  const meetingInfo: MeetingInfo | null = selectedBooking
    ? {
        leadName:
          selectedBooking.first_name?.trim() ||
          selectedBooking.name.trim() ||
          selectedLead?.first_name ||
          null,
        company: selectedBooking.company ?? selectedLead?.company ?? null,
        scheduledAt: selectedBooking.start_time ?? selectedLead?.scheduled_at ?? null,
      }
    : null;

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutRef.current !== null) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const enterClosingPhase = useCallback(
    (options?: { animated?: boolean }) => {
      const animated = options?.animated ?? false;

      clearTransitionTimeout();

      if (!animated) {
        setPhase("closing");
        setContentPhase("pitch");
        setContentAnimation("idle");
        return;
      }

      setContentAnimation("exit");

      transitionTimeoutRef.current = window.setTimeout(() => {
        setPhase("closing");
        setContentPhase("pitch");
        setContentAnimation("enter");

        transitionTimeoutRef.current = window.setTimeout(() => {
          setContentAnimation("idle");
          transitionTimeoutRef.current = null;
        }, SIDEBAR_TRANSITION_MS);
      }, SIDEBAR_TRANSITION_MS);
    },
    [clearTransitionTimeout],
  );

  const backToQualification = useCallback(() => {
    clearTransitionTimeout();
    setPhase("qualification");
    setContentPhase("qualification");
    setContentAnimation("idle");
  }, [clearTransitionTimeout]);

  const resetSessionUiState = useCallback(() => {
    clearTransitionTimeout();
    form.reset(getSalesQualificationDefaultValues(audience));
    setClosingValues(salesClosingDefaultValues);
    setVisitedClosingSectionIds(new Set());
    setPhase("qualification");
    setContentPhase("qualification");
    setContentAnimation("idle");
    setActiveQualificationId("rendez-vous");
    hasAutoTransitionedRef.current = false;
    setSessionResetKey((current) => current + 1);
  }, [audience, clearTransitionTimeout, form]);

  const persistQualificationNotes = useCallback(async () => {
    if (!salesCallId) return;
    await fetch(`/api/admin/sales-calls/${salesCallId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualification: form.getValues() }),
    });
  }, [form, salesCallId]);

  const persistClosingNotes = useCallback(
    async (closing: SalesClosingValues) => {
      if (!salesCallId) return;
      await fetch(`/api/admin/sales-calls/${salesCallId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closing }),
      });
    },
    [salesCallId],
  );

  const loadLeadForBooking = useCallback(
    async (booking: EnrichedCalendlyBooking | null) => {
      resetSessionUiState();
      setSelectedBooking(booking);
      if (!booking?.lead_id || !booking.lead_category) {
        setSelectedLead(null);
        setSalesCallId(null);
        return;
      }

      const leadResponse = await fetch(
        `/api/admin/leads/${booking.lead_id}?category=${booking.lead_category}`,
      );
      if (!leadResponse.ok) {
        setSelectedLead(null);
        return;
      }

      const leadBody = (await leadResponse.json()) as { lead?: LinkTrackingLead };
      setSelectedLead(leadBody.lead ?? null);

      const salesCallResponse = await fetch("/api/admin/sales-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenceId: booking.lead_category === "agence" ? booking.lead_id : null,
          entrepriseId: booking.lead_category === "entreprise" ? booking.lead_id : null,
          comptableId: booking.lead_category === "comptable" ? booking.lead_id : null,
          cifId: booking.lead_category === "cif" ? booking.lead_id : null,
          email: booking.email,
          inviteeUri: booking.invitee_uri,
          scheduledAt: booking.start_time,
        }),
      });

      if (salesCallResponse.ok) {
        const salesCallBody = (await salesCallResponse.json()) as {
          salesCall?: { id: string; notes?: Record<string, unknown> };
        };
        setSalesCallId(salesCallBody.salesCall?.id ?? null);
        const closing = salesCallBody.salesCall?.notes?.closing as
          | Partial<SalesClosingValues>
          | undefined;
        if (closing) {
          setClosingValues((current) => ({ ...current, ...closing }));
        }
      }
    },
    [resetSessionUiState],
  );

  const refreshLead = useCallback(async () => {
    if (!selectedBooking?.lead_id || !selectedBooking.lead_category) return;
    const leadResponse = await fetch(
      `/api/admin/leads/${selectedBooking.lead_id}?category=${selectedBooking.lead_category}`,
    );
    if (!leadResponse.ok) return;
    const leadBody = (await leadResponse.json()) as { lead?: LinkTrackingLead };
    setSelectedLead(leadBody.lead ?? null);
  }, [selectedBooking?.lead_category, selectedBooking?.lead_id]);

  const applyTestPreset = useCallback(
    (preset: {
      qualification: SalesQualificationValues;
      closing: SalesClosingValues;
    }) => {
      form.reset(preset.qualification);
      setClosingValues(preset.closing);
      setVisitedClosingSectionIds(new Set());
    },
    [form],
  );

  useEffect(() => {
    if (phase === "closing") {
      void persistQualificationNotes();
    }
  }, [phase, persistQualificationNotes]);

  useEffect(() => {
    if (phase === "closing") {
      setContentPhase("pitch");
      return;
    }

    setContentPhase("qualification");
  }, [phase]);

  useEffect(() => {
    if (phase !== "closing") {
      return;
    }

    setVisitedClosingSectionIds((current) => {
      if (current.has(activeClosingId)) {
        return current;
      }
      const next = new Set(current);
      next.add(activeClosingId);
      return next;
    });
  }, [activeClosingId, phase]);

  useEffect(() => {
    if (
      !canEnterClosing ||
      !pitchSidebarEnabled ||
      developerModeEnabled ||
      phase !== "qualification" ||
      hasAutoTransitionedRef.current
    ) {
      return;
    }

    hasAutoTransitionedRef.current = true;
    enterClosingPhase({ animated: true });
  }, [canEnterClosing, developerModeEnabled, enterClosingPhase, phase, pitchSidebarEnabled]);

  useEffect(() => {
    if (isCabinetBuyerSalesAudience(audience) && activeClosingId === "activation") {
      setActiveClosingId("envoi-dashboard");
    }
  }, [activeClosingId, audience]);

  useEffect(() => {
    return () => {
      clearTransitionTimeout();
    };
  }, [clearTransitionTimeout]);

  return (
    <Form {...form}>
      <SidebarProvider className="flex h-svh min-h-0 w-full overflow-hidden">
        <SalesFunnelSidebar
          audience={audience}
          name={meetingName}
          progress={progress}
          progressLabel={progressLabel}
          phase={phase}
          contentPhase={contentPhase}
          contentAnimation={contentAnimation}
          activeSectionId={activeSectionId}
          completedSectionIds={completedSectionIds}
          exitHref={exitHref}
          settingsHref={settingsHref}
          canEnterClosing={canEnterClosing}
          pitchSidebarEnabled={pitchSidebarEnabled}
          developerModeEnabled={developerModeEnabled}
          clientSegment={clientSegment}
          meetingInfo={meetingInfo}
          onEnterClosing={() => enterClosingPhase({ animated: true })}
          onBackToQualification={backToQualification}
          onSectionChange={(sectionId) => {
            if (isSalesClosingSectionId(sectionId)) {
              setPhase("closing");
              setActiveClosingId(sectionId);
              return;
            }
            setPhase("qualification");
            setActiveQualificationId(sectionId as SalesFunnelSectionId);
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:px-6">
            <p className="truncate text-sm text-muted-foreground">
              {phase === "closing"
                ? closingSections.find((section) => section.id === activeClosingId)
                    ?.label
                : activeQualificationSection?.label ?? SESSION_PHASE_QUALIFICATION}
            </p>
          </header>
          <div className="flex-1 overflow-auto p-3 md:p-4">
            {phase === "closing" ? (
              <SalesClosingPanel
                audience={audience}
                sectionId={activeClosingId}
                qualificationForm={form}
                closingValues={closingValues}
                onClosingChange={(patch) =>
                  setClosingValues((current) => ({ ...current, ...patch }))
                }
                selectedLead={selectedLead}
                selectedBooking={selectedBooking}
                salesCallId={salesCallId}
                developerMode={developerModeEnabled}
                onRefreshLead={refreshLead}
                onPersistClosing={persistClosingNotes}
              />
            ) : activeQualificationId === "rendez-vous" ? (
              <RendezVousPanel
                audience={audience}
                selectedLead={selectedLead}
                selectedBooking={selectedBooking}
                hasSelectedBooking={selectedBooking !== null}
                sessionResetKey={sessionResetKey}
                onMeetingNameChange={setMeetingName}
                onBookingSelect={loadLeadForBooking}
                onApplyTestPreset={applyTestPreset}
                onResetSession={resetSessionUiState}
              />
            ) : activeQualificationId === "presentation-societe" ? (
              <SalesCompanyPresentationPanel audience={audience} form={form} />
            ) : activeQualificationSection ? (
              <SalesFunnelSectionPage
                key={activeQualificationId}
                audience={audience}
                section={activeQualificationSection}
                form={form}
              />
            ) : null}
          </div>
        </div>
      </SidebarProvider>
    </Form>
  );
}
