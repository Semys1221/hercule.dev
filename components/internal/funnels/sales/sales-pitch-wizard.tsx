"use client";

import Link from "next/link";
import { Check, ChevronDown, PanelLeft } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

import { HerculeMark } from "@/components/hercule-mark";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FOUNDATION_ACTIVATION_BODY,
  FOUNDATION_ACTIVATION_CLOCKS,
  FOUNDATION_ACTIVATION_HEADLINE,
  FOUNDATION_CALENDRIER_CLOSER_COPY,
  FOUNDATION_COMPARISON_ROWS,
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
  FOUNDATION_FOUNDATION_BLOCKS,
  FOUNDATION_FOUNDATION_CLOSER_COPY,
  FOUNDATION_INBOUND_SLA_RULE,
  FOUNDATION_MARKETING_DEPT_BODY,
  FOUNDATION_MARKETING_DEPT_HEADLINE,
  FOUNDATION_MECHANISM_BLOCKS,
  FOUNDATION_ROI_ACK_LABEL,
  FOUNDATION_ROI_DISPLAY,
  FOUNDATION_SIGNALS_SUMMARY,
  formatFoundationRoiScript,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_ACTIVATION_BODY,
  CIF_FOUNDATION_ACTIVATION_CLOCKS,
  CIF_FOUNDATION_ACTIVATION_HEADLINE,
  CIF_FOUNDATION_CALENDRIER_CLOSER_COPY,
  CIF_FOUNDATION_COMPARISON_ROWS,
  CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
  CIF_FOUNDATION_FOUNDATION_BLOCKS,
  CIF_FOUNDATION_FOUNDATION_CLOSER_COPY,
  CIF_FOUNDATION_INBOUND_SLA_RULE,
  CIF_FOUNDATION_MARKETING_DEPT_BODY,
  CIF_FOUNDATION_MARKETING_DEPT_HEADLINE,
  CIF_FOUNDATION_MECHANISM_BLOCKS,
  CIF_FOUNDATION_ROI_ACK_LABEL,
  CIF_FOUNDATION_SIGNALS_SUMMARY,
} from "@/lib/admin/funnels/cif-sales-copy";
import { RESERVATION_BODY_TEXT, RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import { buildBleedTrack, interpolateBleed } from "@/lib/admin/funnels/sales-bleed-track";
import {
  getPitchP11WhyOptions,
  getPitchP12WhyOptions,
  getPitchP2MissingRoleOptions,
  PITCH_CGV_GUARANTEE_HOOK_TEMPLATE,
  PITCH_P0_TRANSITION_TEMPLATE,
  PITCH_P10_ZONE_BODY_TEMPLATE,
  PITCH_P12_PLAN_RECAP_TEMPLATE,
  PITCH_P1B_BRAKE_CALLOUT_TEMPLATE,
  PITCH_P1_METHOD_CONTEXT_TEMPLATE,
  PITCH_P3_DIFFERENTIATION_LEAD_TEMPLATE,
  PITCH_P4_PILLARS_SUBTITLE_TEMPLATE,
  PITCH_P5_CAPTURE_INTRO_TEMPLATE,
  PITCH_P6_COMPARISON_INTRO_TEMPLATE,
  PITCH_P8_ACTIVATION_HOOK_TEMPLATE,
  PITCH_P9_INBOUND_HOOK_TEMPLATE,
  PITCH_P_DASHBOARD_GOAL_CALLOUT_TEMPLATE,
  PITCH_PROI_GOAL_RECAP_TEMPLATE,
} from "@/lib/admin/funnels/sales-pitch-bleed-copy";
import {
  formatHonorairesLabel,
  formatPitchWizardInterpolation,
  getPitchStepPart,
  getVisiblePitchStepIds,
  isPitchFieldComplete,
  PITCH_PART_LABELS,
  usesPitchWizard,
  type PitchInterpolationContext,
  type PitchWizardStepId,
} from "@/lib/admin/funnels/sales-pitch-wizard";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
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
import { cn } from "@/lib/utils";

import {
  SalesDashboardLinkCopy,
  useSalesSessionDashboardLink,
} from "./sales-dashboard-link-copy";
import { SalesPitchOriginSceneLazy } from "./sales-pitch-origin-scene.lazy";
import {
  PITCH_BUYIN_OPTIONS,
  PITCH_CGV_HIGHLIGHTS,
  PITCH_FAQ_ITEMS,
  PITCH_P2_OPTIONS,
  PITCH_P2_PROMPT,
  PITCH_PILLARS,
  PITCH_P11_TEMP_OPTIONS,
  getPitchAudienceLabel,
  getPitchCgvHref,
  getPitchCgvLabel,
  getPitchDifferentiationParagraph,
  getPitchMirrorTemplate,
  getPitchSlides,
  type PitchSlideDefinition,
} from "./sales-pitch-wizard-slides";
import { SalesCoachCue, SalesSingleChoiceField } from "./sales-question-fields";
import type { SalesSingleQuestion } from "./sales-questions";
import { TeamImageFrame } from "./team-image-frame";

const euroDisplay = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function pitchSingleQuestion(
  id: string,
  prompt: string,
  options: SalesSingleQuestion["options"],
): SalesSingleQuestion {
  return { id, number: 0, prompt, sectionId: "pitch", type: "single", options };
}

const COMPACT_CARD_CLASS = `${RESERVATION_SURFACE} gap-0 py-0 shadow-none`;
const COMPACT_ROW_CLASS = "px-5 py-5 md:px-6 md:py-6";
const IMMERSIVE_SURFACE_CLASS = "rounded-lg border border-border/40";

function PitchSurfacePanel({
  immersive,
  children,
  className,
  contentClassName,
}: {
  immersive?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  if (immersive) {
    return (
      <div className={cn(IMMERSIVE_SURFACE_CLASS, "p-5", className, contentClassName)}>
        {children}
      </div>
    );
  }

  return (
    <Card className={cn(RESERVATION_SURFACE, "shadow-none", className)}>
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

type TeamBullet = { highlight: string; text: string };
type TeamMember = { name: string; role: string; history: TeamBullet[] };

const PITCH_TEAM: TeamMember[] = [
  {
    name: "Evan",
    role: "Développeur senior — direction technique.",
    history: [
      {
        highlight: "Mandat d'auditeur principal",
        text: "— dialogue de pair technique sur compatibilité cabinet-TPE et livraison.",
      },
      {
        highlight: "Critères de performance",
        text: "— pérennité des mandats et minimisation des incompatibilités mission.",
      },
      {
        highlight: "Disponibilités limitées",
        text: "— admission ou refus du dossier traitée de manière neutre.",
      },
    ],
  },
  {
    name: "Béatrice",
    role: "Qualification des demandes TPE et relation avec les cabinets partenaires.",
    history: [
      {
        highlight: "Premier filtre",
        text: "— qualification de chaque demande TPE avant transmission au réseau de cabinets.",
      },
      {
        highlight: "Relation partenaires",
        text: "— suivi des cabinets et alignement sur les critères de compatibilité.",
      },
      {
        highlight: "Interface dirigeants",
        text: "— premier contact humain avant passage au commercial.",
      },
    ],
  },
  {
    name: "Thomas",
    role: "Produit et opérations techniques.",
    history: [
      {
        highlight: "Plateforme produit",
        text: "— conception et évolution des outils d'attribution des missions TPE.",
      },
      {
        highlight: "Opérations techniques",
        text: "— fiabilité des parcours cabinet-dirigeant et maintenance des systèmes.",
      },
      {
        highlight: "Automatisation",
        text: "— réduction des délais de traitement via des processus outillés.",
      },
    ],
  },
];

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
        <AlertDescription className="space-y-3 text-sm leading-relaxed">
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

  const slideHeader = currentSlide ? (
    <div className="flex w-full max-w-4xl flex-col gap-2">
      <h2 className="text-xl font-medium tracking-tight">{currentSlide.title}</h2>
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
        <CardContent className={`${COMPACT_ROW_CLASS} space-y-5`}>
          {slideHeader}
          {slideBody}
        </CardContent>
      </Card>

      {navigationRow}
    </div>
  );
}

type PitchSlideContentProps = {
  slide: PitchSlideDefinition;
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  developerModeEnabled: boolean;
  onRefreshLead?: () => Promise<void>;
  immersive?: boolean;
};

export function PitchSlideContent({
  slide,
  audience,
  form,
  values,
  context,
  selectedLead,
  selectedBooking,
  developerModeEnabled,
  onRefreshLead,
  immersive = false,
}: PitchSlideContentProps) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const bleed = buildBleedTrack(values, audience);
  const isCif = isCifSalesAudience(audience);
  const buyInPrompt = isCabinetBuyerSalesAudience(audience)
    ? "Ça fait sens pour le cabinet ? Le cadre est clair ?"
    : "Ça fait sens ? Vous me suivez là-dessus ?";

  switch (slide.type) {
    case "transition":
      return (
        <div className="space-y-4">
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {interpolate(PITCH_P0_TRANSITION_TEMPLATE)}
          </p>
          <PitchSurfacePanel
            immersive={immersive}
            className={immersive ? "border-primary/20" : "border-primary/20 shadow-none"}
          >
            <p className="text-sm font-medium text-foreground">
              {interpolateBleed(getPitchMirrorTemplate(audience), bleed)}
            </p>
          </PitchSurfacePanel>
        </div>
      );

    case "company":
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <HerculeMark variant="dual" className="size-10 shrink-0 text-white" />
            <div>
              <p className="text-lg font-medium">{getPitchAudienceLabel(audience)}</p>
              <p className="text-sm text-muted-foreground">Infrastructure exclusive de zone</p>
            </div>
          </div>
          <TeamImageFrame />
          <PitchSurfacePanel
            immersive={immersive}
            className={immersive ? "border-primary/20" : "border-primary/20 shadow-none"}
          >
            <p className="text-sm font-medium text-foreground">
              {interpolateBleed(getPitchMirrorTemplate(audience), bleed)}
            </p>
          </PitchSurfacePanel>
          <p className="text-sm text-muted-foreground">
            {interpolate(PITCH_P1_METHOD_CONTEXT_TEMPLATE)}
          </p>
          <div className="space-y-3">
            {PITCH_TEAM.map((member) => (
              <Collapsible key={member.name}>
                {immersive ? (
                  <div className={IMMERSIVE_SURFACE_CLASS}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 p-5 text-left"
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 border-t border-border px-5 pb-5 pt-4">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {member.history.map((item) => (
                            <li key={item.highlight}>
                              <span className="font-medium text-foreground">{item.highlight}</span>{" "}
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </div>
                ) : (
                  <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 p-5 text-left"
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-2 border-t border-border px-5 pb-5 pt-4">
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {member.history.map((item) => (
                            <li key={item.highlight}>
                              <span className="font-medium text-foreground">{item.highlight}</span>{" "}
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Card>
                )}
              </Collapsible>
            ))}
          </div>
        </div>
      );

    case "product_origin":
      return (
        <div className="space-y-4">
          <SalesPitchOriginSceneLazy audience={audience} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {interpolate(PITCH_P1B_BRAKE_CALLOUT_TEMPLATE)}
          </p>
        </div>
      );

    case "decision_makers":
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="p2DecisionMakers"
            render={({ field }) => (
              <FormItem>
                <SalesSingleChoiceField
                  question={pitchSingleQuestion("p2", PITCH_P2_PROMPT, [...PITCH_P2_OPTIONS])}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {values.p2DecisionMakers === "missing" ? (
            <FormField
              control={form.control}
              name="p2MissingRole"
              render={({ field }) => (
                <FormItem>
                  <SalesSingleChoiceField
                    question={pitchSingleQuestion(
                      "p2MissingRole",
                      "Qui manque à cette session ?",
                      getPitchP2MissingRoleOptions(audience),
                    )}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
      );

    case "acknowledgment":
      return (
        <div className="space-y-4">
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {interpolate(PITCH_P3_DIFFERENTIATION_LEAD_TEMPLATE)}
          </p>
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {interpolate(getPitchDifferentiationParagraph(audience))}
          </p>
          <p className="text-sm text-muted-foreground">
            On est d&apos;accord que le SEO / la pub, ce n&apos;est pas un actif ?
          </p>
          <FormField
            control={form.control}
            name="p3Acknowledged"
            render={({ field }) => (
              <FormItem>
                <Field orientation="horizontal">
                  <Checkbox
                    id="p3Acknowledged"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="p3Acknowledged" className="text-sm font-normal">
                    Le cabinet valide ce constat.
                  </FieldLabel>
                </Field>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case "cgv":
      return (
        <div className="space-y-4">
          <ul className="space-y-3">
            {PITCH_CGV_HIGHLIGHTS.map((item) => (
              <li key={item.title} className="text-sm">
                <span className="font-medium text-foreground">{item.title}</span>
                <span className="text-muted-foreground"> — {item.description}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {interpolate(PITCH_CGV_GUARANTEE_HOOK_TEMPLATE)}
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href={getPitchCgvHref(audience)} className="underline underline-offset-4">
              {getPitchCgvLabel(audience)}
            </Link>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {interpolate(isCif ? CIF_FOUNDATION_INBOUND_SLA_RULE : FOUNDATION_INBOUND_SLA_RULE)}
          </p>
          <FormField
            control={form.control}
            name="pCgvAccepted"
            render={({ field }) => (
              <FormItem>
                <Field orientation="horizontal">
                  <Checkbox
                    id="pCgvAccepted"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="pCgvAccepted" className="text-sm font-normal leading-relaxed">
                    Le cabinet confirme avoir pris connaissance des {getPitchCgvLabel(audience)},
                    comprend que l&apos;activation et le paiement se font pendant cette session
                    d&apos;audit, et souhaite déployer le Moteur Hercule Foundation sur la zone du
                    cabinet.
                  </FieldLabel>
                </Field>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case "pillars_overview":
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {interpolate(PITCH_P4_PILLARS_SUBTITLE_TEMPLATE)}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
          {PITCH_PILLARS.map((pillar) =>
            immersive ? (
              <div key={pillar.name} className={cn(IMMERSIVE_SURFACE_CLASS, "p-4")}>
                <p className="text-base font-medium">{pillar.name}</p>
                <p className="text-sm text-muted-foreground">{pillar.tagline}</p>
              </div>
            ) : (
              <Card key={pillar.name} className={cn(RESERVATION_SURFACE, "shadow-none")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{pillar.name}</CardTitle>
                  <CardDescription>{pillar.tagline}</CardDescription>
                </CardHeader>
              </Card>
            ),
          )}
          </div>
        </div>
      );

    case "pillar_content":
      return (
        <PillarContentSlide
          slideId={slide.id}
          audience={audience}
          values={values}
          context={context}
          immersive={immersive}
        />
      );

    case "comparison_buyin":
      return (
        <PitchBuyInSlide
          form={form}
          fieldName="p5BuyIn"
          buyInPrompt={buyInPrompt}
          content={
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {interpolate(PITCH_P6_COMPARISON_INTRO_TEMPLATE)}
              </p>
              <ComparisonTable
                rows={isCif ? CIF_FOUNDATION_COMPARISON_ROWS : FOUNDATION_COMPARISON_ROWS}
                immersive={immersive}
              />
            </div>
          }
        />
      );

    case "foundation_buyin":
      return (
        <PitchBuyInSlide
          form={form}
          fieldName="p7FoundationBuyIn"
          buyInPrompt={buyInPrompt}
          content={
            <FoundationSlide
              audience={audience}
              values={values}
              context={context}
              immersive={immersive}
            />
          }
        />
      );

    case "activation_buyin":
      return (
        <PitchBuyInSlide
          form={form}
          fieldName="p7BuyIn"
          buyInPrompt={buyInPrompt}
          content={
            <ActivationSlide
              audience={audience}
              values={values}
              context={context}
              immersive={immersive}
            />
          }
        />
      );

    case "partner_future":
      return (
        <div className="space-y-4">
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {interpolate(
              "[Prénom], imaginez dans 12 mois : la zone est verrouillée, le système tourne, {goal6m} n'est plus un slide — c'est le rythme du cabinet. Sans infrastructure, {inaction} continue de coûter {gap}.",
            )}
          </p>
          <Alert>
            <AlertTitle>Statut de la zone {interpolate("{department}")}</AlertTitle>
            <AlertDescription className="space-y-2 text-sm leading-relaxed">
              <p>En cours d&apos;attribution — 1 seule licence disponible.</p>
              <p>{interpolate(PITCH_P10_ZONE_BODY_TEMPLATE)}</p>
              <p>
                Le moteur consomme une bande passante réelle sur les flux légaux. Un seul cabinet
                par zone. Onboarding aujourd&apos;hui = verrou 12 mois.
              </p>
            </AlertDescription>
          </Alert>
          <PitchBuyInSlide form={form} fieldName="p9BuyIn" buyInPrompt={buyInPrompt} content={null} />
        </div>
      );

    case "roi_contract":
      return (
        <div className="space-y-5">
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Investissement 90 jours · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.investment90DaysEur)} €
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Garantie · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.guaranteeMrrEur)} € MRR cumulé
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Valeur année 1 · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.yearOneValueEur)} €
              </span>
            </p>
          </div>
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {interpolate(PITCH_PROI_GOAL_RECAP_TEMPLATE)}
          </p>
          <p className={cn("text-sm leading-relaxed", RESERVATION_BODY_TEXT)}>
            {formatFoundationRoiScript(
              typeof values.q13 === "number" ? values.q13 : (values.w3 ?? 0),
              bleed.cause,
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {interpolate(
              "Honoraires déclarés : {honoraires}. Écart à combler : {gap}. Le contrat garantit {guaranteeMrr} € de récurrent sur 90 jours — {yearOneValue} € de valeur dès l'année 1.",
            )}
          </p>
          <FormField
            control={form.control}
            name="pRoiAcknowledged"
            render={({ field }) => (
              <FormItem>
                <Field orientation="horizontal">
                  <Checkbox
                    id="pRoiAcknowledged"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <FieldLabel htmlFor="pRoiAcknowledged" className="text-sm font-normal leading-relaxed">
                    {isCif ? CIF_FOUNDATION_ROI_ACK_LABEL : FOUNDATION_ROI_ACK_LABEL}
                  </FieldLabel>
                </Field>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case "faq_close":
      return (
        <div className="space-y-5">
          <Accordion type="single" collapsible className="w-full">
            {PITCH_FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.title}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {interpolate(item.body)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <FormField
            control={form.control}
            name="p11TempCheck"
            render={({ field }) => (
              <FormItem>
                <SalesSingleChoiceField
                  question={pitchSingleQuestion(
                    "p11TempCheck",
                    interpolate(
                      isCabinetBuyerSalesAudience(audience)
                        ? "D'après ce qu'on a couvert, le cabinet considère-t-il que c'est la bonne solution pour atteindre {goal6m} et traiter {gap} ?"
                        : "D'après ce qu'on a couvert, est-ce que vous sentez que c'est la bonne solution pour atteindre {goal6m} et traiter {gap} ?",
                    ),
                    [...PITCH_P11_TEMP_OPTIONS],
                  )}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {values.p11TempCheck === "yes" ? (
            <FormField
              control={form.control}
              name="p11WhyId"
              render={({ field }) => (
                <FormItem>
                  <SalesSingleChoiceField
                    question={pitchSingleQuestion(
                      "p11WhyId",
                      "Pourquoi continuer avec Hercule ?",
                      getPitchP11WhyOptions(values, audience, context),
                    )}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
      );

    case "dashboard_link":
      return (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">
            {interpolate(PITCH_P_DASHBOARD_GOAL_CALLOUT_TEMPLATE)}
          </p>
          <SalesDashboardLinkCopy
            audience={audience}
            selectedLead={selectedLead}
            selectedBooking={selectedBooking}
            developerMode={developerModeEnabled}
            onRefreshLead={onRefreshLead}
          />
        </div>
      );

    case "pricing_close": {
      const p12WhyOptions = getPitchP12WhyOptions(values.p12Plan, values, audience, context);
      return (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {interpolate(PITCH_P12_PLAN_RECAP_TEMPLATE)}
          </p>
          <FormField
            control={form.control}
            name="p12Plan"
            render={({ field }) => (
              <FormItem>
                <RadioGroup
                  value={field.value ?? ""}
                  onValueChange={(next) => {
                    if (field.value && field.value !== next) {
                      form.setValue("p12WhyId", undefined, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                    field.onChange(next);
                  }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {FOUNDATION_PRICING_PLANS.map((plan) => {
                    const inputId = `p12-plan-${plan.id}`;
                    const isSelected = field.value === plan.id;
                    return (
                      <FieldLabel
                        key={plan.id}
                        htmlFor={inputId}
                        className={cn(
                          "block cursor-pointer rounded-lg border bg-card transition-colors hover:border-primary/50 hover:bg-primary/5",
                          isSelected ? "ring-2 ring-foreground" : "ring-1 ring-border",
                        )}
                      >
                        <Card className="border-0 bg-transparent shadow-none">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value={plan.id} id={inputId} className="mt-1" />
                                <CardTitle className="text-base">{plan.name}</CardTitle>
                              </div>
                              {plan.recommended ? (
                                <Badge variant="secondary" className="shrink-0 text-[10px]">
                                  Recommandé
                                </Badge>
                              ) : null}
                            </div>
                            <CardDescription>{plan.tagline}</CardDescription>
                            <p className="pt-1 text-2xl font-medium tracking-tight">
                              {formatFoundationEuros(plan.priceCents)}
                              <span className="text-sm font-normal text-muted-foreground">
                                /mois
                              </span>
                            </p>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <ul className="space-y-2">
                              {plan.features.map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-start gap-2 text-sm text-muted-foreground"
                                >
                                  <Check className="mt-0.5 size-4 shrink-0 text-foreground" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </FieldLabel>
                    );
                  })}
                </RadioGroup>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Investissement 90 jours · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.investment90DaysEur)} €
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Garantie · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.guaranteeMrrEur)} € MRR cumulé
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Valeur année 1 · </span>
              <span className="font-medium">
                {euroDisplay.format(FOUNDATION_ROI_DISPLAY.yearOneValueEur)} €
              </span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            ROI détaillé validé à l&apos;étape précédente — {interpolate("{investment90} € investis → {guaranteeMrr} € garantis → {yearOneValue} € année 1.")}
          </p>
          {values.p12Plan ? (
            <FormField
              control={form.control}
              name="p12WhyId"
              render={({ field }) => (
                <FormItem>
                  <SalesSingleChoiceField
                    question={pitchSingleQuestion(
                      "p12WhyId",
                      "Pourquoi ce plan ?",
                      p12WhyOptions,
                    )}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
      );
    }

    default:
      return null;
  }
}

function PillarContentSlide({
  slideId,
  audience,
  values,
  context,
  immersive = false,
}: {
  slideId: PitchWizardStepId;
  audience: Audience;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  immersive?: boolean;
}) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const isCif = isCifSalesAudience(audience);
  const signalsSummary = isCif ? CIF_FOUNDATION_SIGNALS_SUMMARY : FOUNDATION_SIGNALS_SUMMARY;
  const mechanismBlocks = isCif ? CIF_FOUNDATION_MECHANISM_BLOCKS : FOUNDATION_MECHANISM_BLOCKS;

  if (slideId === "p5") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {interpolate(PITCH_P5_CAPTURE_INTRO_TEMPLATE)}
        </p>
        <p className="text-sm font-medium text-foreground">
          Capture d&apos;intention de zone au nom du cabinet — pas des « ads » Meta/Google.
        </p>
        <p className="text-sm text-muted-foreground">{signalsSummary}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mechanismBlocks.map((block, index) => (
            <PitchSurfacePanel key={block.id} immersive={immersive} contentClassName="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Étape {index + 1}
              </p>
              <p className="font-medium text-foreground">{block.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{block.description}</p>
            </PitchSurfacePanel>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {interpolate(
            "Pour traiter {cause} — le cabinet est visible lorsque la TPE entre dans le besoin, et non par prospection active.",
          )}
        </p>
      </div>
    );
  }

  if (slideId === "p7") {
    return null;
  }

  if (slideId === "p9") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-foreground">
          Account management — appels de pilotage, rapports, alignement cabinet ↔ Hercule.
        </p>
        <PitchSurfacePanel immersive={immersive} contentClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead>Hercule</TableHead>
                <TableHead>Cabinet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Capture live</TableCell>
                <TableCell>Maintient l&apos;infrastructure, rapports hebdo</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Traitement inbound</TableCell>
                <TableCell>—</TableCell>
                <TableCell>Réponse &lt; 24 h sur chaque demande</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Appels</TableCell>
                <TableCell>Points réguliers (onboarding + suivi)</TableCell>
                <TableCell>Présence décideur / associé</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Escalade</TableCell>
                <TableCell>Ajustement ciblage si friction</TableCell>
                <TableCell>Feedback terrain sur qualité des demandes</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </PitchSurfacePanel>
        <p className="text-sm text-muted-foreground">
          {interpolate(PITCH_P9_INBOUND_HOOK_TEMPLATE)}
        </p>
        <p className="text-sm text-muted-foreground">
          Les deux parties sont responsables — pas un fournisseur de fiches qui disparaît après la
          vente.
        </p>
      </div>
    );
  }

  return null;
}

function ComparisonTable({
  rows,
  immersive = false,
}: {
  rows: typeof FOUNDATION_COMPARISON_ROWS;
  immersive?: boolean;
}) {
  return (
    <PitchSurfacePanel immersive={immersive} contentClassName="p-0">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Critère</TableHead>
              <TableHead>SEO / pub</TableHead>
              <TableHead>Foundation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.criterion}>
                <TableCell className="font-medium">{row.criterion}</TableCell>
                <TableCell className="text-muted-foreground">{row.seo}</TableCell>
                <TableCell>{row.foundation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </PitchSurfacePanel>
  );
}

function FoundationSlide({
  audience,
  values,
  context,
  immersive = false,
}: {
  audience: Audience;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  immersive?: boolean;
}) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const isCif = isCifSalesAudience(audience);
  const headline = isCif
    ? CIF_FOUNDATION_MARKETING_DEPT_HEADLINE
    : FOUNDATION_MARKETING_DEPT_HEADLINE;
  const body = isCif ? CIF_FOUNDATION_MARKETING_DEPT_BODY : FOUNDATION_MARKETING_DEPT_BODY;
  const blocks = isCif ? CIF_FOUNDATION_FOUNDATION_BLOCKS : FOUNDATION_FOUNDATION_BLOCKS;
  const closer = isCif
    ? CIF_FOUNDATION_FOUNDATION_CLOSER_COPY
    : FOUNDATION_FOUNDATION_CLOSER_COPY;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">{headline}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((block) =>
          immersive ? (
            <div key={block.id} className={cn(IMMERSIVE_SURFACE_CLASS, "p-4")}>
              <div className="flex flex-wrap items-baseline gap-2 pb-2">
                <Badge variant="outline">{block.month}</Badge>
                <p className="text-base font-medium">{block.title}</p>
              </div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Card key={block.id} className={cn(RESERVATION_SURFACE, "shadow-none")}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Badge variant="outline">{block.month}</Badge>
                  <CardTitle className="text-base">{block.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ),
        )}
      </div>
      <p className="text-sm text-muted-foreground">{interpolate(closer)}</p>
      <p className="text-sm text-muted-foreground">
        {interpolate(
          "Combler {gap} vers {goal6m} — fondations en priorité, puis montée en volume.",
        )}
      </p>
    </div>
  );
}

function ActivationSlide({
  audience,
  values,
  context,
  immersive = false,
}: {
  audience: Audience;
  values: SalesQualificationValues;
  context: PitchInterpolationContext;
  immersive?: boolean;
}) {
  const interpolate = (template: string) =>
    formatPitchWizardInterpolation(template, values, audience, context);
  const isCif = isCifSalesAudience(audience);
  const headline = isCif ? CIF_FOUNDATION_ACTIVATION_HEADLINE : FOUNDATION_ACTIVATION_HEADLINE;
  const body = isCif ? CIF_FOUNDATION_ACTIVATION_BODY : FOUNDATION_ACTIVATION_BODY;
  const clocks = isCif ? CIF_FOUNDATION_ACTIVATION_CLOCKS : FOUNDATION_ACTIVATION_CLOCKS;
  const weeklyLines = isCif
    ? CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES
    : FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES;
  const closerCopy = isCif
    ? CIF_FOUNDATION_CALENDRIER_CLOSER_COPY
    : FOUNDATION_CALENDRIER_CLOSER_COPY;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {interpolate(PITCH_P8_ACTIVATION_HOOK_TEMPLATE)}
      </p>
      <p className="text-sm font-medium text-foreground">{headline}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {clocks.map((clock) => (
          <PitchSurfacePanel key={clock.id} immersive={immersive} contentClassName="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {clock.label} · {clock.duration}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{clock.message}</p>
          </PitchSurfacePanel>
        ))}
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>{weeklyLines[0]}</li>
        <li>{weeklyLines[2]}</li>
        <li>{weeklyLines[5]}</li>
      </ul>
      <p className="text-sm leading-relaxed text-muted-foreground">{closerCopy}</p>
    </div>
  );
}

function PitchBuyInSlide({
  form,
  fieldName,
  content,
  buyInPrompt = "Ça fait sens ? Vous me suivez là-dessus ?",
}: {
  form: UseFormReturn<SalesQualificationValues>;
  fieldName: "p5BuyIn" | "p7FoundationBuyIn" | "p7BuyIn" | "p9BuyIn";
  content: ReactNode;
  buyInPrompt?: string;
}) {
  return (
    <div className="space-y-4">
      {content}
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <SalesSingleChoiceField
              question={pitchSingleQuestion(fieldName, buyInPrompt, [...PITCH_BUYIN_OPTIONS])}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
