"use client";

import { PanelLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import {
  formatPitchWizardInterpolation,
  getPitchStepPart,
  getVisiblePitchStepIds,
  isPitchFieldComplete,
  PITCH_PART_LABELS,
  usesPitchWizard,
  type PitchInterpolationContext,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import {
  SESSION_DEV_SYSTEM_PREVIEW_BODY,
  SESSION_DEV_SYSTEM_PREVIEW_TITLE,
  SESSION_SECTION_SYSTEM_FINISH_CTA,
  SESSION_SECTION_SYSTEM_LOCKED_BODY,
  SESSION_SECTION_SYSTEM_LOCKED_TITLE,
} from "@/lib/admin/funnels/ui-copy";
import type { Audience } from "@/lib/admin/navigation";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { PitchSlideContent } from "./pitch";
import { useSalesSessionDashboardLink } from "./sales-dashboard-link-copy";
import { SalesCoachCue } from "./sales-question-fields";
import { getPitchSlides, type PitchSlideDefinition } from "./sales-pitch-wizard-slides";

export { PitchSlideContent } from "./pitch";

const COMPACT_CARD_CLASS = `${RESERVATION_SURFACE} gap-0 py-0 shadow-none`;
const COMPACT_ROW_CLASS = "px-5 py-5 md:px-6 md:py-6";

type SalesPitchWizardProps = {
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  prospectFirstName?: string;
  department?: string;
  developerModeEnabled?: boolean;
  selectedLead?: LinkTrackingLead | null;
  selectedBooking?: EnrichedCalendlyBooking | null;
  onRefreshLead?: () => Promise<void>;
  onGoToObjectifs?: () => void;
  immersive?: boolean;
  onOpenSidebar?: () => void;
};

export function SalesPitchWizard({
  audience,
  form,
  prospectFirstName: prospectFirstNameProp,
  department,
  developerModeEnabled = false,
  selectedLead = null,
  selectedBooking = null,
  onRefreshLead,
  onGoToObjectifs,
  immersive = false,
  onOpenSidebar,
}: SalesPitchWizardProps) {
  const prospectFirstName =
    prospectFirstNameProp ??
    (isCabinetBuyerSalesAudience(audience) ? "le cabinet" : "vous");
  const watchedPartial = useWatch({ control: form.control });
  const values = mergeSalesQualificationValues(
    watchedPartial as Partial<SalesQualificationValues>,
    audience,
  );
  const interpolationContext: PitchInterpolationContext = {
    prospectFirstName,
    department,
  };
  const pitchUnlocked = usesPitchWizard(values) || developerModeEnabled;
  const valuesForStepVisibility = useMemo(
    () =>
      developerModeEnabled && !usesPitchWizard(values)
        ? { ...values, bleedDiagnosticAccepted: true }
        : values,
    [developerModeEnabled, values],
  );
  const dashboardLink = useSalesSessionDashboardLink(
    selectedLead,
    selectedBooking,
    developerModeEnabled,
  );

  const allSlides = useMemo(() => getPitchSlides(audience), [audience]);
  const visibleStepIds = useMemo(
    () => getVisiblePitchStepIds(valuesForStepVisibility, audience, interpolationContext),
    [audience, interpolationContext, valuesForStepVisibility],
  );
  const visibleSlides = useMemo(
    () =>
      visibleStepIds
        .map((id) => allSlides.find((slide) => slide.id === id))
        .filter((slide): slide is PitchSlideDefinition => Boolean(slide)),
    [allSlides, visibleStepIds],
  );

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (stepIndex > visibleSlides.length - 1) {
      setStepIndex(Math.max(visibleSlides.length - 1, 0));
    }
  }, [stepIndex, visibleSlides.length]);

  if (!pitchUnlocked) {
    const lockedContent = (
      <Alert>
        <AlertTitle>{SESSION_SECTION_SYSTEM_LOCKED_TITLE}</AlertTitle>
        <AlertDescription className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>{SESSION_SECTION_SYSTEM_LOCKED_BODY}</p>
          <p className="text-muted-foreground">
            Terminez le wizard Objectifs jusqu&apos;à « Valider la carte diagnostic », ou chargez le
            preset Test depuis Réglages de la session.
          </p>
          {onGoToObjectifs ? (
            <Button type="button" variant="outline" onClick={onGoToObjectifs}>
              Retour aux Objectifs
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );

    if (immersive) {
      return (
        <div className="relative flex h-full min-h-0 flex-col bg-card">
          {onOpenSidebar ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-3 top-3 z-10 size-9 text-muted-foreground hover:text-foreground"
              aria-label="Ouvrir le menu des étapes"
              onClick={onOpenSidebar}
            >
              <PanelLeft className="size-4" />
            </Button>
          ) : null}
          <div className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
            <div className="w-full max-w-lg">{lockedContent}</div>
          </div>
        </div>
      );
    }

    return lockedContent;
  }

  const safeStepIndex = Math.min(stepIndex, Math.max(visibleSlides.length - 1, 0));
  const currentSlide = visibleSlides[safeStepIndex];
  const progressValue =
    visibleSlides.length > 0 ? ((safeStepIndex + 1) / visibleSlides.length) * 100 : 0;
  const currentPart = currentSlide ? getPitchStepPart(currentSlide.id) : "societe";

  const canGoNext = currentSlide
    ? currentSlide.id === "pDashboard"
      ? Boolean(dashboardLink)
      : isPitchFieldComplete(currentSlide.id, values, audience, interpolationContext)
    : false;
  const canGoPrev = safeStepIndex > 0;
  const isLastStep = safeStepIndex >= visibleSlides.length - 1;

  const handleNext = () => {
    if (!currentSlide || !canGoNext) {
      return;
    }
    if (isLastStep && currentSlide.id === "pDashboard") {
      form.setValue("pitchWizardCompleted", true, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }
    setStepIndex((index) => Math.min(index + 1, visibleSlides.length - 1));
  };

  const slideTitle = currentSlide
    ? formatPitchWizardInterpolation(
        currentSlide.title,
        values,
        audience,
        interpolationContext,
      )
    : "";

  const slideHeader = currentSlide ? (
    <div className="flex w-full max-w-4xl flex-col gap-2">
      <h2 className="text-xl font-medium tracking-tight">{slideTitle}</h2>
      {currentSlide.trainingNote ? (
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {currentSlide.trainingNote}
        </p>
      ) : null}
      {currentSlide.coachCue ? <SalesCoachCue cue={currentSlide.coachCue} /> : null}
    </div>
  ) : null;

  const slideBody = currentSlide ? (
    <PitchSlideContent
      slide={currentSlide}
      audience={audience}
      form={form}
      values={values}
      context={interpolationContext}
      selectedLead={selectedLead}
      selectedBooking={selectedBooking}
      developerModeEnabled={developerModeEnabled}
      onRefreshLead={onRefreshLead}
      immersive={immersive}
    />
  ) : null;

  const navigationRow = (
    <div className="flex items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={!canGoPrev}
        onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
      >
        Précédent
      </Button>
      <Button type="button" disabled={!canGoNext} onClick={handleNext}>
        {isLastStep && currentSlide?.id === "pDashboard"
          ? SESSION_SECTION_SYSTEM_FINISH_CTA
          : isLastStep
            ? "Terminer"
            : "Suivant"}
      </Button>
    </div>
  );

  if (immersive) {
    return (
      <div className="relative flex h-full min-h-0 flex-col bg-card">
        <Progress value={progressValue} className="h-px shrink-0 rounded-none" />

        {onOpenSidebar ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-3 top-3 z-10 size-9 text-muted-foreground hover:text-foreground"
            aria-label="Ouvrir le menu des étapes"
            onClick={onOpenSidebar}
          >
            <PanelLeft className="size-4" />
          </Button>
        ) : null}

        {developerModeEnabled && !usesPitchWizard(values) ? (
          <div className="px-6 pt-12 md:px-10">
            <Alert>
              <AlertTitle>{SESSION_DEV_SYSTEM_PREVIEW_TITLE}</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed">
                {SESSION_DEV_SYSTEM_PREVIEW_BODY}
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          {slideHeader}
          <div className="w-full max-w-4xl">{slideBody}</div>
        </div>

        <div className="shrink-0 border-t border-border/40 px-6 py-6 md:px-10 md:py-8">
          {navigationRow}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {developerModeEnabled && !usesPitchWizard(values) ? (
        <Alert>
          <AlertTitle>{SESSION_DEV_SYSTEM_PREVIEW_TITLE}</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {SESSION_DEV_SYSTEM_PREVIEW_BODY}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {PITCH_PART_LABELS[currentPart]} · Étape {safeStepIndex + 1} / {visibleSlides.length}
          </span>
          <span>{Math.round(progressValue)} %</span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <Card className={COMPACT_CARD_CLASS}>
        <CardContent className={`${COMPACT_ROW_CLASS} flex flex-col gap-5`}>
          {slideHeader}
          {slideBody}
        </CardContent>
      </Card>

      {navigationRow}
    </div>
  );
}
