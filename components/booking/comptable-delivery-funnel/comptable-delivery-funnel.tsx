"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ComptableDeliveryFunnelShell } from "@/components/booking/comptable-delivery-funnel/shell";
import { CalendlyStep } from "@/components/booking/comptable-delivery-funnel/steps/calendly-step";
import { ChecklistStep } from "@/components/booking/comptable-delivery-funnel/steps/checklist-step";
import { ChoiceStep } from "@/components/booking/comptable-delivery-funnel/steps/choice-step";
import { ConfirmationStep } from "@/components/booking/comptable-delivery-funnel/steps/confirmation-step";
import { EducationStep } from "@/components/booking/comptable-delivery-funnel/steps/education-step";
import { FreeTextStep } from "@/components/booking/comptable-delivery-funnel/steps/free-text-step";
import { IntroStep } from "@/components/booking/comptable-delivery-funnel/steps/intro-step";
import { FunnelStepMotion } from "@/components/booking/comptable-delivery-funnel/motion";
import { useReservationSession } from "@/components/booking/reservation/use-reservation-session";
import { getFunnelCopy } from "@/lib/booking/comptable-delivery-funnel/copy";
import {
  canAccessCalendlyStep,
  getNextStepId,
  getPrevStepId,
  isStepAnswered,
} from "@/lib/booking/comptable-delivery-funnel/navigation";
import type { FunnelRouteSegment, FunnelStepId } from "@/lib/booking/comptable-delivery-funnel/schema";
import {
  fetchQualificationBySlug,
  upsertQualification,
} from "@/lib/booking/comptable-delivery-funnel/sync-client";
import { useComptableDeliveryFunnelStore } from "@/lib/booking/comptable-delivery-funnel/store";
import { buildCalendlySchedulingUrl } from "@/lib/legacy/booking/reservation-surface";

export type ComptableDeliveryFunnelProps = {
  slug: string;
  email: string;
  calendlyUrl: string;
  routeSegment: FunnelRouteSegment;
};

function answersToRecord(answers: Partial<Record<FunnelStepId, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string" && value.trim()) {
      out[key] = value;
    }
  }
  return out;
}

export function ComptableDeliveryFunnel({
  slug,
  email,
  calendlyUrl: calendlyUrlProp,
  routeSegment,
}: ComptableDeliveryFunnelProps) {
  const copyBundle = useMemo(() => getFunnelCopy(routeSegment), [routeSegment]);
  const session = useReservationSession({
    slug,
    calendlyUrl: calendlyUrlProp,
    pageTitle: "Réserver un créneau · Expert-comptable",
    confirmedTitle: "Rendez-vous confirmé",
  });

  const hydrated = useComptableDeliveryFunnelStore((s) => s.hydrated);
  const funnelState = useComptableDeliveryFunnelStore((s) => s.getForSlug(slug));
  const ensureSlug = useComptableDeliveryFunnelStore((s) => s.ensureSlug);
  const setAnswer = useComptableDeliveryFunnelStore((s) => s.setAnswer);
  const setCurrentStep = useComptableDeliveryFunnelStore((s) => s.setCurrentStep);
  const setPhase = useComptableDeliveryFunnelStore((s) => s.setPhase);
  const mergeWithServer = useComptableDeliveryFunnelStore((s) => s.mergeWithServer);
  const bootstrapDone = useRef(false);
  const [funnelComplete, setFunnelComplete] = useState(false);

  useEffect(() => {
    ensureSlug(slug, routeSegment);
  }, [ensureSlug, slug, routeSegment]);

  useEffect(() => {
    if (!hydrated || bootstrapDone.current) return;
    bootstrapDone.current = true;

    void (async () => {
      try {
        const record = await fetchQualificationBySlug(slug, routeSegment);
        if (record) {
          mergeWithServer(slug, {
            routeSegment: record.routeSegment,
            currentStepId: record.currentStepId,
            phase: record.phase,
            answers: record.answers as Partial<Record<FunnelStepId, string>>,
          });
          return;
        }
      } catch {
        /* local persist fallback */
      }
    })();
  }, [hydrated, slug, routeSegment, mergeWithServer]);

  useEffect(() => {
    if (!session.confirmed) return;
    const state = useComptableDeliveryFunnelStore.getState().getForSlug(slug);
    if (state.phase === "pre_booking" || state.currentStepId === "calendly") {
      setPhase(slug, "post_booking");
      setCurrentStep(slug, "confirmation");
    }
  }, [session.confirmed, setPhase, setCurrentStep, slug]);

  const persistState = useCallback(
    async (extras?: {
      bookedAt?: string | null;
      postBookingCompletedAt?: string | null;
      preBookingCompletedAt?: string | null;
    }) => {
      const state = useComptableDeliveryFunnelStore.getState().getForSlug(slug);
      try {
        await upsertQualification({
          slug,
          routeSegment,
          phase: state.phase,
          currentStepId: state.currentStepId,
          answers: answersToRecord(state.answers),
          bookedAt: extras?.bookedAt ?? (session.confirmed ? new Date().toISOString() : null),
          preBookingCompletedAt:
            extras?.preBookingCompletedAt ??
            (canAccessCalendlyStep(state.answers) ? new Date().toISOString() : null),
          postBookingCompletedAt: extras?.postBookingCompletedAt ?? null,
        });
      } catch {
        /* offline — local persist remains */
      }
    },
    [slug, routeSegment, session.confirmed],
  );

  const goToStep = useCallback(
    (stepId: FunnelStepId) => {
      setCurrentStep(slug, stepId);
      void persistState();
    },
    [persistState, setCurrentStep, slug],
  );

  const handleContinue = useCallback(() => {
    const state = useComptableDeliveryFunnelStore.getState().getForSlug(slug);
    const next = getNextStepId(state.currentStepId, state.phase);
    if (!next) {
      if (state.currentStepId === "final_prep") {
        void persistState({ postBookingCompletedAt: new Date().toISOString() });
        setFunnelComplete(true);
      }
      return;
    }
    if (next === "calendly" && !canAccessCalendlyStep(state.answers)) {
      return;
    }
    goToStep(next);
  }, [goToStep, persistState, slug]);

  const handleBack = useCallback(() => {
    const state = useComptableDeliveryFunnelStore.getState().getForSlug(slug);
    const prev = getPrevStepId(state.currentStepId, state.phase);
    if (prev) goToStep(prev);
  }, [goToStep, slug]);

  const handleScheduled = useCallback(() => {
    session.markConfirmed();
    setPhase(slug, "post_booking");
    setCurrentStep(slug, "confirmation");
    void persistState({ bookedAt: new Date().toISOString() });
  }, [persistState, session, setCurrentStep, setPhase, slug]);

  const calendlyWidgetUrl = buildCalendlySchedulingUrl(session.calendlyUrl, {
    email,
    slug,
  });

  const stepCopy = copyBundle.steps[funnelState.currentStepId];
  const currentAnswer = funnelState.answers[funnelState.currentStepId];

  const showHero = funnelState.currentStepId !== "calendly";

  if (funnelComplete) {
    return (
      <ComptableDeliveryFunnelShell copy={copyBundle} showHero>
        <div className="space-y-3 text-left">
          <h2 className="text-[28px] font-normal tracking-tight text-foreground">
            Merci, tout est prêt.
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Votre expert dispose des informations pour préparer votre échange. Vous recevrez les
            détails du rendez-vous par email.
          </p>
        </div>
      </ComptableDeliveryFunnelShell>
    );
  }

  if (!hydrated) {
    return (
      <ComptableDeliveryFunnelShell copy={copyBundle} showHero={showHero}>
        <p className="text-center text-muted-foreground">Chargement…</p>
      </ComptableDeliveryFunnelShell>
    );
  }

  const renderStep = () => {
    if (!stepCopy) return null;

    switch (stepCopy.kind) {
      case "intro":
        return <IntroStep copy={stepCopy} onContinue={handleContinue} />;
      case "single_choice":
        return (
          <ChoiceStep
            copy={stepCopy}
            value={currentAnswer}
            onChange={(value) => {
              setAnswer(slug, stepCopy.stepId, value);
            }}
            onBack={handleBack}
            onContinue={() => {
              if (!isStepAnswered(stepCopy.stepId, funnelState.answers)) return;
              handleContinue();
            }}
          />
        );
      case "education":
        return (
          <EducationStep
            copy={stepCopy}
            onBack={handleBack}
            onContinue={handleContinue}
            showBack={funnelState.currentStepId !== "mental_prep" ? true : true}
          />
        );
      case "free_text":
        return (
          <FreeTextStep
            copy={stepCopy}
            value={currentAnswer ?? ""}
            onChange={(value) => setAnswer(slug, stepCopy.stepId, value)}
            onBack={handleBack}
            onContinue={handleContinue}
          />
        );
      case "confirmation":
        return <ConfirmationStep copy={stepCopy} onContinue={handleContinue} />;
      case "checklist":
        return <ChecklistStep copy={stepCopy} onContinue={handleContinue} />;
      case "calendly":
        if (!canAccessCalendlyStep(funnelState.answers)) {
          goToStep("engagement");
          return null;
        }
        return (
          <CalendlyStep
            copy={stepCopy}
            calendlyUrl={calendlyWidgetUrl}
            onScheduled={handleScheduled}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  if (funnelState.currentStepId === "calendly") {
    const calendlyCopy = copyBundle.steps.calendly;
    if (calendlyCopy.kind !== "calendly") return null;
    if (!canAccessCalendlyStep(funnelState.answers)) {
      return (
        <ComptableDeliveryFunnelShell copy={copyBundle} showHero>
          <p className="text-muted-foreground">Veuillez compléter les questions précédentes.</p>
        </ComptableDeliveryFunnelShell>
      );
    }
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-amber-100 via-orange-50 to-teal-100 p-4 md:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl bg-background p-4 shadow-2xl md:rounded-[2.5rem] md:p-8">
          <CalendlyStep
            copy={calendlyCopy}
            calendlyUrl={calendlyWidgetUrl}
            onScheduled={handleScheduled}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <ComptableDeliveryFunnelShell copy={copyBundle} showHero={showHero}>
      <FunnelStepMotion stepKey={funnelState.currentStepId}>{renderStep()}</FunnelStepMotion>
    </ComptableDeliveryFunnelShell>
  );
}
