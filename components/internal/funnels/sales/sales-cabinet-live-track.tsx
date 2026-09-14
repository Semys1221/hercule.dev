"use client";

import { useEffect, useMemo, useState } from "react";
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

  const interpolationContext: PitchInterpolationContext = {
    prospectFirstName,
  };
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
  const currentStepId = trackStepIds[safeStepIndex];
  const currentSection = currentStepId ? getLiveTrackSection(currentStepId) : "objectifs";
  const progressValue =
    trackStepIds.length > 0 ? ((safeStepIndex + 1) / trackStepIds.length) * 100 : 0;

  useEffect(() => {
    if (stepIndex > trackStepIds.length - 1) {
      setStepIndex(Math.max(trackStepIds.length - 1, 0));
    }
  }, [stepIndex, trackStepIds.length]);

  useEffect(() => {
    onActiveSectionChange?.(currentSection);
  }, [currentSection, onActiveSectionChange]);

  useEffect(() => {
    if (activeQualificationId === "pitch") {
      const pitchStart = getLiveTrackSectionStartIndex(trackStepIds, "pitch");
      if (pitchStart >= 0) {
        setStepIndex((index) => (index < pitchStart ? pitchStart : index));
      }
      return;
    }

    if (activeQualificationId === "objectifs") {
      const pitchStart = getLiveTrackSectionStartIndex(trackStepIds, "pitch");
      if (pitchStart >= 0) {
        setStepIndex((index) => Math.min(index, pitchStart - 1));
      }
    }
  }, [activeQualificationId, trackStepIds]);

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

    setStepIndex((index) => Math.min(index + 1, trackStepIds.length - 1));
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
  const shellCoachCue =
    currentPitchSlide?.coachCue ??
    (currentObjectifsQuestion?.coachCue
      ? formatObjectifsWizardInterpolation(
          currentObjectifsQuestion.coachCue,
          values,
          audience,
        )
      : undefined);

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
        <AlertTitle>Mode DEV — pitch en preview</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed">
          Accès complet au wizard sans carte diagnostic validée. Chargez le preset Test pour
          l&apos;interpolation cause / écart / objectifs.
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
      coachCue={shellCoachCue}
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
      layout={chartPresence === "moment" ? "split" : "stacked"}
      contentClassName={pitchContentSlide ? "items-start" : undefined}
    >
      {body}
    </SalesImmersiveSessionShell>
  );
}
