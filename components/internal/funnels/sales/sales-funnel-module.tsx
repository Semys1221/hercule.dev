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
import {
  buildBleedTrack,
  formatBleedStickyChips,
} from "@/lib/admin/funnels/sales-bleed-track";
import { sessionHubHref, pathToHref, type Audience } from "@/lib/admin/navigation";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { SalesFunnelWorkspace } from "./sales-funnel-workspace";
import {
  getSalesClosingSections,
  isSalesClosingSectionComplete,
  isSalesClosingSectionId,
  salesClosingDefaultValues,
  type SalesClosingSectionId,
  type SalesClosingValues,
} from "./sales-closing-sections";
import {
  getSalesFunnelSection,
  getSalesFunnelSections,
  type SalesFunnelSectionId,
} from "./sales-funnel-sections";
import { extractSalesIntroFields } from "./sales-intro-script";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const hasAutoTransitionedRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const renderCountRef = useRef(0);

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
  const prospectFirstName = useMemo(() => {
    if (!selectedBooking) {
      return isCabinetBuyerSalesAudience(audience) ? "le cabinet" : "vous";
    }
    return extractSalesIntroFields(selectedBooking, audience).firstName;
  }, [audience, selectedBooking]);

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
    const qualificationCompleted = funnelSections
      .filter((section) => !section.documentationOnly)
      .filter((section) =>
        isSalesSectionComplete(section.id, watchedValues, audience),
      )
      .map((section) => section.id);

    const closingCompleted = closingSections.filter((section) =>
      isSalesClosingSectionComplete(section.id, closingCompletionContext, audience),
    ).map((section) => section.id);

    return [...qualificationCompleted, ...closingCompleted];
  }, [audience, closingCompletionContext, funnelSections, watchedValues]);

  const bleedChips = useMemo(() => {
    if (!completedSectionIds.includes("objectifs")) {
      return [];
    }
    return formatBleedStickyChips(buildBleedTrack(watchedValues, audience));
  }, [audience, completedSectionIds, watchedValues]);

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
  const objectifsComplete = isSalesSectionComplete("objectifs", watchedValues, audience);
  const activeQualificationSection = getSalesFunnelSection(
    activeQualificationId,
    audience,
    clientSegment,
  );
  const immersiveCabinetWizard =
    phase === "qualification" &&
    isCabinetBuyerSalesAudience(audience) &&
    (activeQualificationId === "objectifs" || activeQualificationId === "pitch");

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
        if (isCabinetBuyerSalesAudience(audience)) {
          setActiveClosingId("envoi-dashboard");
        }
        return;
      }

      setContentAnimation("exit");

      transitionTimeoutRef.current = window.setTimeout(() => {
        setPhase("closing");
        setContentPhase("pitch");
        setContentAnimation("enter");
        if (isCabinetBuyerSalesAudience(audience)) {
          setActiveClosingId("envoi-dashboard");
        }

        transitionTimeoutRef.current = window.setTimeout(() => {
          setContentAnimation("idle");
          transitionTimeoutRef.current = null;
        }, SIDEBAR_TRANSITION_MS);
      }, SIDEBAR_TRANSITION_MS);
    },
    [audience, clearTransitionTimeout],
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
      hasAutoTransitionedRef.current ||
      isCabinetBuyerSalesAudience(audience)
    ) {
      return;
    }

    hasAutoTransitionedRef.current = true;
    enterClosingPhase({ animated: true });
  }, [audience, canEnterClosing, developerModeEnabled, enterClosingPhase, phase, pitchSidebarEnabled]);

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

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d7ea7b" },
      body: JSON.stringify({
        sessionId: "d7ea7b",
        runId: "post-fix",
        hypothesisId: "C",
        location: "sales-funnel-module.tsx:onOpenChange",
        message: "SidebarProvider open change",
        data: { open },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    setSidebarOpen(open);
  }, []);

  const handleLiveTrackSectionChange = useCallback(
    (section: SalesFunnelSectionId) => {
      setActiveQualificationId((current) => {
        const willChange = current !== section;
        // #region agent log
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
          body: JSON.stringify({
            sessionId: "8ae7a5",
            runId: "pre-fix",
            hypothesisId: "D",
            location: "sales-funnel-module.tsx:onLiveTrackSectionChange",
            message: "live track section sync to parent",
            data: { section, current, willChange },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return willChange ? section : current;
      });
    },
    [],
  );

  // #region agent log
  renderCountRef.current += 1;
  useEffect(() => {
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d7ea7b" },
      body: JSON.stringify({
        sessionId: "d7ea7b",
        runId: "post-fix",
        hypothesisId: "A-E",
        location: "sales-funnel-module.tsx:render",
        message: "SalesFunnelShell render",
        data: {
          renderCount: renderCountRef.current,
          phase,
          contentPhase,
          activeQualificationId,
          activeClosingId,
          immersiveCabinetWizard,
          sidebarOpen,
          clientSegment,
          collapsible: immersiveCabinetWizard ? "offcanvas" : "none",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  });
  // #endregion

  const sidebarProps = {
    audience,
    name: meetingName,
    progress,
    progressLabel,
    phase,
    contentPhase,
    contentAnimation,
    activeSectionId,
    completedSectionIds,
    exitHref,
    settingsHref,
    canEnterClosing,
    pitchSidebarEnabled,
    developerModeEnabled,
    clientSegment,
    meetingInfo,
    bleedChips,
    objectifsComplete,
    onEnterClosing: () => enterClosingPhase({ animated: true }),
    onBackToQualification: backToQualification,
    onSectionChange: (sectionId: SalesFunnelSectionId | SalesClosingSectionId) => {
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d7ea7b" },
        body: JSON.stringify({
          sessionId: "d7ea7b",
          runId: "post-fix",
          hypothesisId: "C",
          location: "sales-funnel-module.tsx:onSectionChange",
          message: "sidebar section change",
          data: {
            sectionId,
            activeQualificationId,
            activeClosingId,
            sidebarOpen,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (
        isCabinetBuyerSalesAudience(audience) &&
        (sectionId === "objectifs" || sectionId === "pitch")
      ) {
        setSidebarOpen(false);
      } else if (isCabinetBuyerSalesAudience(audience)) {
        setSidebarOpen(true);
      }
      if (isSalesClosingSectionId(sectionId)) {
        setPhase("closing");
        setActiveClosingId(sectionId);
        return;
      }
      if (
        sectionId === "pitch" &&
        isCabinetBuyerSalesAudience(audience) &&
        !objectifsComplete &&
        !developerModeEnabled
      ) {
        return;
      }
      setPhase("qualification");
      setActiveQualificationId(sectionId as SalesFunnelSectionId);
    },
  };

  return (
    <Form {...form}>
      <SidebarProvider
        className="flex h-svh min-h-0 w-full overflow-hidden"
        open={immersiveCabinetWizard ? sidebarOpen : undefined}
        onOpenChange={immersiveCabinetWizard ? handleSidebarOpenChange : undefined}
      >
        <SalesFunnelSidebar
          {...sidebarProps}
          collapsible={immersiveCabinetWizard ? "offcanvas" : "none"}
          className={immersiveCabinetWizard ? "z-50" : undefined}
        />
        <SalesFunnelWorkspace
          audience={audience}
          phase={phase}
          activeQualificationId={activeQualificationId}
          activeClosingId={activeClosingId}
          activeQualificationSection={activeQualificationSection}
          closingSections={closingSections}
          form={form}
          closingValues={closingValues}
          selectedLead={selectedLead}
          selectedBooking={selectedBooking}
          salesCallId={salesCallId}
          sessionResetKey={sessionResetKey}
          developerModeEnabled={developerModeEnabled}
          prospectFirstName={prospectFirstName}
          immersiveCabinetWizard={immersiveCabinetWizard}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => {
            setSidebarOpen((open) => !open);
          }}
          onGoToObjectifs={() => {
            setPhase("qualification");
            setActiveQualificationId("objectifs");
            setSidebarOpen(false);
          }}
          onLiveTrackSectionChange={handleLiveTrackSectionChange}
          onClosingChange={(patch) =>
            setClosingValues((current) => ({ ...current, ...patch }))
          }
          onMeetingNameChange={setMeetingName}
          onBookingSelect={loadLeadForBooking}
          onApplyTestPreset={applyTestPreset}
          onResetSession={resetSessionUiState}
          onRefreshLead={refreshLead}
          onPersistClosing={persistClosingNotes}
        />
      </SidebarProvider>
    </Form>
  );
}
