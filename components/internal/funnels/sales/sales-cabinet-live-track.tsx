"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { B3_YEAR_MAP } from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  getLiveTrackSection,
  getLiveTrackSectionStartIndex,
  getVisibleLiveTrackStepIds,
  type LiveTrackSection,
  type LiveTrackStepId,
} from "@/lib/admin/funnels/sales-cabinet-live-track";
import {
  formatObjectifsWizardInterpolation,
  getDefaultWizardChartMetric,
  getImmersiveChartPresence,
  getWizardChartMetricForQuestion,
  isWizardFieldComplete,
  type WizardChartMetricId,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import {
  isPitchFieldComplete,
  type PitchInterpolationContext,
  type PitchWizardStepId,
  usesPitchWizard,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Audience } from "@/lib/admin/navigation";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { PitchSlideContent } from "./sales-pitch-wizard";
import { getPitchSlides, type PitchSlideDefinition } from "./sales-pitch-wizard-slides";
import { useSalesSessionDashboardLink } from "./sales-dashboard-link-copy";
import { SalesImmersiveSessionShell } from "./sales-immersive-session-shell";
import { SalesObjectifsWizardChartLazy } from "./sales-objectifs-wizard-chart.lazy";
import {
  resolveWizardQuestionCopy,
  WizardQuestionField,
} from "./sales-objectifs-wizard";
import {
  SESSION_DEV_SYSTEM_PREVIEW_BODY,
  SESSION_DEV_SYSTEM_PREVIEW_TITLE,
} from "@/lib/admin/funnels/ui-copy";
import { getSalesQuestionsForSection } from "./sales-questions";
import type { SalesFunnelSectionId } from "./sales-funnel-sections";

const CHART_WATCH_FIELDS = [
  "w2",
  "w3",
  "w4",
  "w5",
  "w6",
  "w7",
  "w18",
  "bleedDiagnosticAccepted",
] as const satisfies ReadonlyArray<keyof SalesQualificationValues>;

type SalesCabinetLiveTrackProps = {
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  activeQualificationId: SalesFunnelSectionId;
  prospectFirstName?: string;
  developerModeEnabled?: boolean;
  selectedLead?: LinkTrackingLead | null;
  selectedBooking?: EnrichedCalendlyBooking | null;
  onRefreshLead?: () => Promise<void>;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  onActiveSectionChange?: (section: LiveTrackSection) => void;
};

export function SalesCabinetLiveTrack({
  audience,
  form,
  activeQualificationId,
  prospectFirstName = "vous",
  developerModeEnabled = false,
  selectedLead = null,
  selectedBooking = null,
  onRefreshLead,
  onOpenSidebar,
  sidebarOpen = false,
  onActiveSectionChange,
}: SalesCabinetLiveTrackProps) {
  const watchedPartial = useWatch({ control: form.control });
  const chartPartial = useWatch({
    control: form.control,
    name: [...CHART_WATCH_FIELDS],
  });
  const values = mergeSalesQualificationValues(
    watchedPartial as Partial<SalesQualificationValues>,
    audience,
  );
  const chartValues = useMemo(
    () =>
      mergeSalesQualificationValues(
        {
          ...(watchedPartial as Partial<SalesQualificationValues>),
          ...(Array.isArray(chartPartial)
            ? Object.fromEntries(
                CHART_WATCH_FIELDS.map((field, index) => [field, chartPartial[index]]),
              )
            : {}),
        },
        audience,
      ),
    [audience, chartPartial, watchedPartial],
  );

  const interpolationContext = useMemo<PitchInterpolationContext>(
    () => ({ prospectFirstName }),
    [prospectFirstName],
  );
  const dashboardLink = useSalesSessionDashboardLink(
    selectedLead,
    selectedBooking,
    developerModeEnabled,
  );

  const trackStepIds = useMemo(
    () =>
      getVisibleLiveTrackStepIds(values, audience, interpolationContext, {
        developerMode: developerModeEnabled,
      }),
    [audience, developerModeEnabled, interpolationContext, values],
  );

  const allObjectifsQuestions = useMemo(
    () => getSalesQuestionsForSection("objectifs", audience),
    [audience],
  );
  const allPitchSlides = useMemo(() => getPitchSlides(audience), [audience]);

  const [stepIndex, setStepIndex] = useState(0);
  const [touchedSliders, setTouchedSliders] = useState<Set<string>>(() => new Set());
  const [chartMetricId, setChartMetricId] = useState<WizardChartMetricId>(() =>
    getDefaultWizardChartMetric(values),
  );

  const safeStepIndex = Math.min(stepIndex, Math.max(trackStepIds.length - 1, 0));
  const trackStepKey = trackStepIds.join("|");
  const currentStepId = trackStepIds[safeStepIndex];
  const currentSection = currentStepId ? getLiveTrackSection(currentStepId) : "objectifs";
  const progressValue =
    trackStepIds.length > 0 ? ((safeStepIndex + 1) / trackStepIds.length) * 100 : 0;

  useEffect(() => {
    if (stepIndex > trackStepIds.length - 1) {
      setStepIndex(Math.max(trackStepIds.length - 1, 0));
    }
  }, [stepIndex, trackStepIds.length]);

  const onActiveSectionChangeRef = useRef(onActiveSectionChange);
  onActiveSectionChangeRef.current = onActiveSectionChange;
  const lastSyncedStepIndexRef = useRef<number | null>(null);
  const suppressSectionReportRef = useRef(false);

  useEffect(() => {
    const pitchStart = getLiveTrackSectionStartIndex(trackStepIds, "pitch");
    const usesPitch = usesPitchWizard(values);

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
      body: JSON.stringify({
        sessionId: "8ae7a5",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "sales-cabinet-live-track.tsx:sidebar-sync-effect",
        message: "sidebar sync effect evaluated",
        data: {
          activeQualificationId,
          safeStepIndex,
          pitchStart,
          currentStepId,
          usesPitch,
          bleedDiagnosticAccepted: values.bleedDiagnosticAccepted,
          trackStepCount: trackStepIds.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (activeQualificationId === "pitch") {
      if (pitchStart >= 0 && safeStepIndex < pitchStart) {
        // #region agent log
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
          body: JSON.stringify({
            sessionId: "8ae7a5",
            runId: "pre-fix",
            hypothesisId: "A",
            location: "sales-cabinet-live-track.tsx:sidebar-sync-effect",
            message: "forcing step forward to pitch start",
            data: { pitchStart, safeStepIndex },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        suppressSectionReportRef.current = true;
        setStepIndex(pitchStart);
      }
      return;
    }

    if (activeQualificationId === "objectifs") {
      if (pitchStart >= 0 && safeStepIndex >= pitchStart) {
        // #region agent log
        fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
          body: JSON.stringify({
            sessionId: "8ae7a5",
            runId: "pre-fix",
            hypothesisId: "A",
            location: "sales-cabinet-live-track.tsx:sidebar-sync-effect",
            message: "RESET step back from pitch to last objectifs",
            data: { pitchStart, safeStepIndex, resetTo: pitchStart - 1 },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        suppressSectionReportRef.current = true;
        setStepIndex(pitchStart - 1);
      }
    }
  }, [activeQualificationId, currentStepId, safeStepIndex, trackStepKey, values]);

  useEffect(() => {
    if (suppressSectionReportRef.current) {
      suppressSectionReportRef.current = false;
      lastSyncedStepIndexRef.current = safeStepIndex;
      return;
    }
    if (lastSyncedStepIndexRef.current === safeStepIndex) {
      return;
    }
    lastSyncedStepIndexRef.current = safeStepIndex;
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
      body: JSON.stringify({
        sessionId: "8ae7a5",
        runId: "pre-fix",
        hypothesisId: "D",
        location: "sales-cabinet-live-track.tsx:onActiveSectionChange-effect",
        message: "live track reporting section after step change",
        data: {
          currentSection,
          activeQualificationId,
          currentStepId,
          safeStepIndex,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    onActiveSectionChangeRef.current?.(currentSection);
  }, [activeQualificationId, currentSection, currentStepId, safeStepIndex]);

  useEffect(() => {
    if (values.w10 && values.w10 in B3_YEAR_MAP) {
      const year = B3_YEAR_MAP[values.w10];
      if (year && values.w10Year !== year) {
        form.setValue("w10Year", year, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [form, values.w10, values.w10Year]);

  useEffect(() => {
    if (!currentStepId) {
      return;
    }
    const metricForQuestion = getWizardChartMetricForQuestion(currentStepId);
    if (metricForQuestion) {
      setChartMetricId(metricForQuestion);
    }
  }, [currentStepId]);

  const markSliderTouched = (questionId: string) => {
    setTouchedSliders((previous) => {
      if (previous.has(questionId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(questionId);
      return next;
    });
  };

  const currentObjectifsQuestion = useMemo(() => {
    if (!currentStepId || getLiveTrackSection(currentStepId) !== "objectifs") {
      return null;
    }
    const question = allObjectifsQuestions.find((item) => item.id === currentStepId);
    return question ? resolveWizardQuestionCopy(question, values, audience) : null;
  }, [allObjectifsQuestions, audience, currentStepId, values]);

  const currentPitchSlide = useMemo(() => {
    if (!currentStepId || getLiveTrackSection(currentStepId) !== "pitch") {
      return null;
    }
    return allPitchSlides.find((slide) => slide.id === currentStepId) ?? null;
  }, [allPitchSlides, currentStepId]);

  const chartPresence = currentStepId ? getImmersiveChartPresence(currentStepId) : "off";
  const chartVariant =
    chartPresence === "hero"
      ? "hero"
      : chartPresence === "moment"
        ? "moment"
        : chartPresence === "peek"
          ? "peek"
          : "panel";

  const canGoPrev = safeStepIndex > 0;
  const isLastStep = safeStepIndex >= trackStepIds.length - 1;

  const canGoNext = (() => {
    if (!currentStepId) {
      return false;
    }
    if (getLiveTrackSection(currentStepId) === "objectifs") {
      return isWizardFieldComplete(currentStepId, values, {
        touchedSliderFields: touchedSliders,
        audience,
      });
    }
    if (currentStepId === "pDashboard") {
      return Boolean(dashboardLink);
    }
    if (getLiveTrackSection(currentStepId) === "pitch") {
      return isPitchFieldComplete(
        currentStepId as PitchWizardStepId,
        values,
        audience,
        interpolationContext,
      );
    }
    return false;
  })();

  const handleNext = () => {
    const pitchStart = getLiveTrackSectionStartIndex(trackStepIds, "pitch");
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "8ae7a5" },
      body: JSON.stringify({
        sessionId: "8ae7a5",
        runId: "pre-fix",
        hypothesisId: "B-C-E",
        location: "sales-cabinet-live-track.tsx:handleNext",
        message: "handleNext invoked",
        data: {
          currentStepId,
          canGoNext,
          isLastStep,
          safeStepIndex,
          pitchStart,
          nextStepId: trackStepIds[safeStepIndex + 1] ?? null,
          usesPitch: usesPitchWizard(values),
          bleedDiagnosticAccepted: values.bleedDiagnosticAccepted,
          trackStepCount: trackStepIds.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!currentStepId || !canGoNext) {
      return;
    }

    if (isLastStep && currentStepId === "pDashboard") {
      form.setValue("pitchWizardCompleted", true, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const nextIndex = Math.min(safeStepIndex + 1, trackStepIds.length - 1);
    const nextStepId = trackStepIds[nextIndex];
    if (nextStepId) {
      const nextSection = getLiveTrackSection(nextStepId);
      if (nextSection !== currentSection) {
        onActiveSectionChangeRef.current?.(nextSection);
      }
    }
    setStepIndex(nextIndex);
  };

  const handlePrev = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  if (
    !usesPitchWizard(values) &&
    !developerModeEnabled &&
    currentStepId &&
    getLiveTrackSection(currentStepId) === "pitch"
  ) {
    return null;
  }

  const pitchContentSlide =
    currentPitchSlide &&
    !["faq_close", "dashboard_link", "pricing_close"].includes(currentPitchSlide.type);

  const shellTitle = (() => {
    if (currentObjectifsQuestion) {
      return currentObjectifsQuestion.prompt;
    }
    if (currentPitchSlide && !pitchContentSlide) {
      return currentPitchSlide.title;
    }
    if (currentPitchSlide) {
      return currentPitchSlide.title;
    }
    return undefined;
  })();

  const shellDescription = currentObjectifsQuestion?.description;

  const chartNode =
    chartPresence !== "off" ? (
      <SalesObjectifsWizardChartLazy
        audience={audience}
        values={chartValues}
        metricId={chartMetricId}
        onMetricChange={setChartMetricId}
        variant={chartVariant}
        showMetricTabs={chartPresence === "moment" || chartPresence === "hero"}
      />
    ) : null;

  const body = (() => {
    if (currentObjectifsQuestion) {
      return (
        <WizardQuestionField
          audience={audience}
          form={form}
          question={currentObjectifsQuestion}
          values={values}
          onSliderTouched={markSliderTouched}
          variant="immersive"
        />
      );
    }

    if (currentPitchSlide) {
      if (pitchContentSlide) {
        return (
          <div className="w-full max-w-4xl">
            <PitchSlideContent
              slide={currentPitchSlide}
              audience={audience}
              form={form}
              values={values}
              context={interpolationContext}
              selectedLead={selectedLead}
              selectedBooking={selectedBooking}
              developerModeEnabled={developerModeEnabled}
              onRefreshLead={onRefreshLead}
              immersive
            />
          </div>
        );
      }

      return (
        <PitchSlideContent
          slide={currentPitchSlide}
          audience={audience}
          form={form}
          values={values}
          context={interpolationContext}
          selectedLead={selectedLead}
          selectedBooking={selectedBooking}
          developerModeEnabled={developerModeEnabled}
          onRefreshLead={onRefreshLead}
          immersive
        />
      );
    }

    return null;
  })();

  const footer =
    developerModeEnabled && !usesPitchWizard(values) ? (
      <Alert>
        <AlertTitle>{SESSION_DEV_SYSTEM_PREVIEW_TITLE}</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed">
          {SESSION_DEV_SYSTEM_PREVIEW_BODY}
        </AlertDescription>
      </Alert>
    ) : null;

  return (
    <SalesImmersiveSessionShell
      progressValue={progressValue}
      stepNumber={safeStepIndex + 1}
      totalSteps={trackStepIds.length}
      title={shellTitle}
      description={shellDescription}
      chart={chartNode}
      footer={footer}
      canGoPrev={canGoPrev}
      canGoNext={canGoNext}
      nextLabel={
        isLastStep && currentStepId === "pDashboard"
          ? "Terminer la session"
          : "Étape suivante"
      }
      onPrev={handlePrev}
      onNext={handleNext}
      onOpenSidebar={onOpenSidebar}
      sidebarOpen={sidebarOpen}
      layout={chartPresence === "moment" ? "split" : "stacked"}
      contentClassName={pitchContentSlide ? "items-start" : undefined}
    >
      {body}
    </SalesImmersiveSessionShell>
  );
}
