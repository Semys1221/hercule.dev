"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Layers,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FaqRichText } from "@/components/legacy/dashboard/faq-rich-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { DashboardBleedContext } from "@/lib/legacy/dashboard/bleed-context";
import {
  buildRecoveryPitchScreens,
  getRecoveryStepIds,
  isRecoveryDiagnosticComplete,
  type RecoveryDiagnostic,
  type RecoveryPitchAngle,
  type ServiceFitAnswer,
} from "@/lib/legacy/dashboard/closing-recovery";

type StepClosingRecoveryProps = {
  open: boolean;
  angle: RecoveryPitchAngle;
  bleedContext?: DashboardBleedContext;
  onComplete: (diagnostic: RecoveryDiagnostic) => void;
};

const BEAT_CONFIG = [
  { key: "what" as const, label: "Ce que nous faisons", icon: Target },
  { key: "how" as const, label: "Comment nous le faisons", icon: Layers },
  { key: "whyDifferent" as const, label: "Pourquoi nous sommes différents", icon: Sparkles },
  { key: "benefit" as const, label: "Ce que cela vous apporte", icon: UserRound },
];

function RecoveryBleedBannerWithAngle({
  bleedContext,
  angle,
}: {
  bleedContext?: DashboardBleedContext;
  angle: RecoveryPitchAngle;
}) {
  const bleed = bleedContext?.bleed;
  if (!bleed) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-4">
      {bleed.cause ? (
        <Badge variant="outline">{bleed.cause}</Badge>
      ) : null}
      {bleed.gap ? (
        <Badge variant="outline">Écart : {bleed.gap}</Badge>
      ) : null}
      {bleedContext?.zone ? (
        <Badge variant="secondary">Zone : {bleedContext.zone}</Badge>
      ) : null}
      {angle === 2 ? (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          Angle urgence
        </Badge>
      ) : null}
    </div>
  );
}

export function StepClosingRecovery({
  open,
  angle,
  bleedContext,
  onComplete,
}: StepClosingRecoveryProps) {
  const stepIds = useMemo(() => getRecoveryStepIds(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnostic, setDiagnostic] = useState<RecoveryDiagnostic>({
    serviceFits: null,
    serviceWhy: "",
    friction: "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setStepIndex(0);
    setDiagnostic({
      serviceFits: null,
      serviceWhy: "",
      friction: "",
    });
  }, [angle, open]);

  const currentStepId = stepIds[stepIndex];
  const progressValue = ((stepIndex + 1) / stepIds.length) * 100;
  const pitchScreens = useMemo(
    () => buildRecoveryPitchScreens(diagnostic, bleedContext, angle),
    [angle, diagnostic, bleedContext],
  );
  const currentPitch = pitchScreens.find((screen) => screen.id === currentStepId);
  const isPitchStep = Boolean(currentPitch);

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

  const headerTitle =
    angle === 2
      ? "Reprenons avec le contexte de votre cabinet"
      : "Un dernier échange avant l'activation";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">{headerTitle}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Étape {stepIndex + 1} sur {stepIds.length}
          {angle === 2 ? " · cycle 2" : " · cycle 1"}
        </p>
        <Progress value={progressValue} className="mt-3" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-2xl">
          <RecoveryBleedBannerWithAngle bleedContext={bleedContext} angle={angle} />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-6 flex flex-col gap-6"
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
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
                      <RadioGroupItem value="oui" id="service-fit-oui" />
                      <Label htmlFor="service-fit-oui" className="cursor-pointer font-normal">
                        Oui, dans l&apos;ensemble
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
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
                    <Alert variant={angle === 2 ? "destructive" : "default"}>
                      <AlertTriangle className="size-4" />
                      <AlertTitle>Statut zone</AlertTitle>
                      <AlertDescription>
                        <FaqRichText text={currentPitch.alert} />
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <ItemGroup className="gap-2">
                    {BEAT_CONFIG.map((beat) => {
                      const Icon = beat.icon;
                      return (
                        <Item key={beat.key} variant="outline" size="sm">
                          <ItemMedia variant="icon">
                            <Icon className="size-4" />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{beat.label}</ItemTitle>
                            <ItemDescription className="text-sm leading-relaxed">
                              <FaqRichText text={currentPitch.beats[beat.key]} />
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      );
                    })}
                  </ItemGroup>
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
          {stepIndex < stepIds.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={!isPitchStep && !canGoNextDiagnostic}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!isRecoveryDiagnosticComplete(diagnostic)}
            >
              {angle === 2 ? "Passer à l'activation" : "Continuer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
