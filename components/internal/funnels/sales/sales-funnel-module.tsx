"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Form } from "@/components/ui/form";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  getPitchSidebarEnabled,
  getPitchSidebarEnabledServerSnapshot,
  getPitchSidebarEnabledSnapshot,
  subscribePitchSidebarEnabled,
} from "@/lib/admin/funnels/sales-funnel-settings";
import {
  getSalesQualificationProgress,
  isSalesQualificationComplete,
  isSalesSectionComplete,
  mergeSalesQualificationValues,
  salesQualificationDefaultValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import { pathToHref, type Audience } from "@/lib/admin/navigation";
import { SESSION_PHASE_QUALIFICATION } from "@/lib/admin/funnels/ui-copy";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { RendezVousPanel } from "./rendez-vous-panel";
import { SalesClosingPanel } from "./sales-closing-panel";
import {
  isSalesClosingSectionComplete,
  SALES_CLOSING_SECTIONS,
  salesClosingDefaultValues,
  type SalesClosingSectionId,
  type SalesClosingValues,
} from "./sales-closing-sections";
import { SalesCompanyPresentationPanel } from "./sales-company-presentation-panel";
import { SalesFunnelSectionPage } from "./sales-funnel-section-page";
import {
  getSalesFunnelSection,
  SALES_FUNNEL_SECTIONS,
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
  const [contentPhase, setContentPhase] = useState<SidebarContentPhase>(() =>
    getPitchSidebarEnabled(audience) ? "pitch" : "qualification",
  );
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

  const hasAutoTransitionedRef = useRef(false);
  const transitionTimeoutRef = useRef<number | null>(null);

  const pitchSidebarEnabled = useSyncExternalStore(
    subscribePitchSidebarEnabled,
    () => getPitchSidebarEnabledSnapshot(audience),
    getPitchSidebarEnabledServerSnapshot,
  );

  const form = useForm<SalesQualificationValues>({
    defaultValues: salesQualificationDefaultValues,
    mode: "onChange",
  });

  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
  );

  const exitHref = pathToHref([audience, "sales"]);
  const settingsHref = pathToHref([audience, "sales", "funnel", "settings"]);
  const activeSectionId = phase === "closing" ? activeClosingId : activeQualificationId;

  const completedSectionIds = useMemo(() => {
    if (phase === "closing") {
      return SALES_CLOSING_SECTIONS.filter((section) =>
        isSalesClosingSectionComplete(section.id, closingValues),
      ).map((section) => section.id);
    }

    return SALES_FUNNEL_SECTIONS.filter((section) =>
      isSalesSectionComplete(section.id, watchedValues),
    ).map((section) => section.id);
  }, [closingValues, phase, watchedValues]);

  const { progress, progressLabel } = useMemo(() => {
    if (phase === "closing") {
      const completed = SALES_CLOSING_SECTIONS.filter((section) =>
        isSalesClosingSectionComplete(section.id, closingValues),
      ).length;
      const total = SALES_CLOSING_SECTIONS.length;
      return {
        progress: Math.round((completed / total) * 100),
        progressLabel: `${completed}/${total}`,
      };
    }

    const { completedSections, totalSections, percent } =
      getSalesQualificationProgress(watchedValues);

    return {
      progress: percent,
      progressLabel: `${completedSections}/${totalSections}`,
    };
  }, [closingValues, phase, watchedValues]);

  const canEnterClosing = isSalesQualificationComplete(watchedValues);
  const activeQualificationSection = getSalesFunnelSection(activeQualificationId);

  const meetingInfo: MeetingInfo | null = selectedLead
    ? {
        leadName: selectedBooking?.first_name ?? selectedLead.first_name,
        company: selectedBooking?.company ?? selectedLead.company,
        scheduledAt: selectedBooking?.start_time ?? selectedLead.scheduled_at,
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
        setActiveClosingId("recap");
        return;
      }

      setContentAnimation("exit");

      transitionTimeoutRef.current = window.setTimeout(() => {
        setPhase("closing");
        setContentPhase("pitch");
        setContentAnimation("enter");
        setActiveClosingId("recap");

        transitionTimeoutRef.current = window.setTimeout(() => {
          setContentAnimation("idle");
          transitionTimeoutRef.current = null;
        }, SIDEBAR_TRANSITION_MS);
      }, SIDEBAR_TRANSITION_MS);
    },
    [clearTransitionTimeout],
  );

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
          agenceId: booking.lead_id,
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
    [],
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

  useEffect(() => {
    if (phase === "closing") {
      void persistQualificationNotes();
    }
  }, [phase, persistQualificationNotes]);

  useEffect(() => {
    if (phase !== "qualification") {
      return;
    }

    setContentPhase(pitchSidebarEnabled ? "pitch" : "qualification");
  }, [phase, pitchSidebarEnabled]);

  useEffect(() => {
    if (
      !canEnterClosing ||
      !pitchSidebarEnabled ||
      phase !== "qualification" ||
      hasAutoTransitionedRef.current
    ) {
      return;
    }

    hasAutoTransitionedRef.current = true;
    enterClosingPhase({ animated: true });
  }, [canEnterClosing, enterClosingPhase, phase, pitchSidebarEnabled]);

  useEffect(() => {
    return () => {
      clearTransitionTimeout();
    };
  }, [clearTransitionTimeout]);

  return (
    <Form {...form}>
      <SidebarProvider className="flex h-svh min-h-0 w-full overflow-hidden">
        <SalesFunnelSidebar
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
          meetingInfo={meetingInfo}
          onEnterClosing={() => enterClosingPhase({ animated: true })}
          onSectionChange={(sectionId) => {
            if (phase === "closing") {
              setActiveClosingId(sectionId as SalesClosingSectionId);
              return;
            }
            setActiveQualificationId(sectionId as SalesFunnelSectionId);
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center border-b border-border px-4 md:px-6">
            <p className="truncate text-sm text-muted-foreground">
              {phase === "closing"
                ? SALES_CLOSING_SECTIONS.find((section) => section.id === activeClosingId)
                    ?.label
                : activeQualificationSection?.label ?? SESSION_PHASE_QUALIFICATION}
            </p>
          </header>
          <div className="flex-1 overflow-auto p-3 md:p-4">
            {phase === "closing" ? (
              <SalesClosingPanel
                sectionId={activeClosingId}
                qualificationForm={form}
                closingValues={closingValues}
                onClosingChange={(patch) =>
                  setClosingValues((current) => ({ ...current, ...patch }))
                }
                selectedLead={selectedLead}
                salesCallId={salesCallId}
                onRefreshLead={refreshLead}
                onPersistClosing={persistClosingNotes}
              />
            ) : activeQualificationId === "rendez-vous" ? (
              <RendezVousPanel
                audience={audience}
                selectedLead={selectedLead}
                onMeetingNameChange={setMeetingName}
                onBookingSelect={loadLeadForBooking}
              />
            ) : activeQualificationId === "presentation-societe" ? (
              <SalesCompanyPresentationPanel form={form} />
            ) : activeQualificationSection ? (
              <SalesFunnelSectionPage section={activeQualificationSection} form={form} />
            ) : null}
          </div>
        </div>
      </SidebarProvider>
    </Form>
  );
}
