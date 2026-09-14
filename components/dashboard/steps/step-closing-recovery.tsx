"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import {
  buildRecoveryPitchScreens,
  getRecoveryStepIds,
  isRecoveryDiagnosticComplete,
  type RecoveryDiagnostic,
  type ServiceFitAnswer,
} from "@/lib/dashboard/closing-recovery";

type StepClosingRecoveryProps = {
  open: boolean;
  bleedContext?: DashboardBleedContext;
  onComplete: (diagnostic: RecoveryDiagnostic) => void;
  onSkipToPayment: () => void;
};

const BEAT_LABELS = [
  { key: "what" as const, label: "Ce que nous faisons" },
  { key: "how" as const, label: "Comment nous le faisons" },
  { key: "whyDifferent" as const, label: "Pourquoi nous sommes différents" },
  { key: "benefit" as const, label: "Ce que cela vous apporte" },
];

export function StepClosingRecovery({
  open,
  bleedContext,
  onComplete,
  onSkipToPayment,
}: StepClosingRecoveryProps) {
  const stepIds = useMemo(() => getRecoveryStepIds(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnostic, setDiagnostic] = useState<RecoveryDiagnostic>({
    serviceFits: null,
    serviceWhy: "",
    friction: "",
  });

  const currentStepId = stepIds[stepIndex];
  const progressValue = ((stepIndex + 1) / stepIds.length) * 100;
  const pitchScreens = useMemo(
    () => buildRecoveryPitchScreens(diagnostic, bleedContext),
    [diagnostic, bleedContext],
  );
  const currentPitch = pitchScreens.find((screen) => screen.id === currentStepId);

  if (!open) {
    return null;
  }

  const canGoNextDiagnostic =
    currentStepId === "service-fit"
      ? Boolean(diagnostic.serviceFits)
      : currentStepId === "service-why"
        ? diagnostic.serviceWhy.trim().length >= 10
        : currentStepId === "friction"
          ? diagnostic.friction.trim().length >= 10
          : true;

  function goNext() {
    if (stepIndex >= stepIds.length - 1) {
      if (isRecoveryDiagnosticComplete(diagnostic)) {
        onComplete(diagnostic);
      }
      return;
    }
    setStepIndex((current) => current + 1);
  }

  function goPrev() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-medium">Un dernier échange avant l&apos;activation</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Étape {stepIndex + 1} sur {stepIds.length}
        </p>
        <Progress value={progressValue} className="mt-3" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              {currentStepId === "service-fit" ? (
                <div className="flex flex-col gap-4">
                  <p className="text-base font-medium">
                    Le service, tel qu&apos;on l&apos;a présenté, correspond-il à ce que vous
                    attendez ?
                  </p>
                  <RadioGroup
                    value={diagnostic.serviceFits ?? undefined}
                    onValueChange={(value) =>
                      setDiagnostic((current) => ({
                        ...current,
                        serviceFits: value as ServiceFitAnswer,
                      }))
                    }
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <RadioGroupItem value="oui" id="service-fit-oui" />
                      <Label htmlFor="service-fit-oui" className="cursor-pointer font-normal">
                        Oui, dans l&apos;ensemble
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <RadioGroupItem value="pas_encore" id="service-fit-pas_encore" />
                      <Label
                        htmlFor="service-fit-pas_encore"
                        className="cursor-pointer font-normal"
                      >
                        Pas encore tout à fait
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              ) : null}

              {currentStepId === "service-why" ? (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="service-why">
                    Qu&apos;est-ce qui vous donne cette impression ?
                  </Label>
                  <Textarea
                    id="service-why"
                    value={diagnostic.serviceWhy}
                    onChange={(event) =>
                      setDiagnostic((current) => ({
                        ...current,
                        serviceWhy: event.target.value,
                      }))
                    }
                    placeholder="Ce qui me rassure / ce qui me questionne encore…"
                    rows={4}
                  />
                </div>
              ) : null}

              {currentStepId === "friction" ? (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="friction">
                    Y a-t-il un point précis qui vous retient pour l&apos;instant ?
                  </Label>
                  <Textarea
                    id="friction"
                    value={diagnostic.friction}
                    onChange={(event) =>
                      setDiagnostic((current) => ({
                        ...current,
                        friction: event.target.value,
                      }))
                    }
                    placeholder="Concrètement, ce serait…"
                    rows={4}
                  />
                </div>
              ) : null}

              {currentPitch ? (
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-medium">{currentPitch.title}</h3>
                  {currentPitch.alert ? (
                    <Card className="border-border bg-muted/30">
                      <CardContent className="pt-4 text-sm text-muted-foreground">
                        <FaqRichText text={currentPitch.alert} />
                      </CardContent>
                    </Card>
                  ) : null}
                  <div className="flex flex-col gap-3">
                    {BEAT_LABELS.map((beat) => (
                      <Card key={beat.key} className="border-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">{beat.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-muted-foreground">
                          <FaqRichText text={currentPitch.beats[beat.key]} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={goPrev} disabled={stepIndex === 0}>
          Précédent
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="ghost" onClick={onSkipToPayment}>
            Passer au paiement
          </Button>
          {stepIndex < stepIds.length - 1 ? (
            <Button type="button" onClick={goNext} disabled={!canGoNextDiagnostic}>
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!isRecoveryDiagnosticComplete(diagnostic)}
            >
              Continuer vers l&apos;activation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
