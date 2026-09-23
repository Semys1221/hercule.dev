"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";
import type { OnboardingStepStatus } from "@/lib/clients/engin-types";
import { toast } from "@/hooks/use-toast";

type EnginOnboardingSheetProps = {
  clientId: string | null;
  clientLabel: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function statusBadge(status: OnboardingStepStatus["status"]) {
  switch (status) {
    case "sent":
      return <Badge>Envoyé</Badge>;
    case "pending":
      return <Badge variant="secondary">Planifié</Badge>;
    case "failed":
      return <Badge variant="destructive">Échec</Badge>;
    case "cancelled":
      return <Badge variant="outline">Annulé</Badge>;
    default:
      return <Badge variant="outline">Absent</Badge>;
  }
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EnginOnboardingSheet({
  clientId,
  clientLabel,
  open,
  onOpenChange,
}: EnginOnboardingSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [steps, setSteps] = React.useState<OnboardingStepStatus[]>([]);
  const [answers, setAnswers] = React.useState<ClientOnboardingAnswers | null>(null);

  React.useEffect(() => {
    if (!open || !clientId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSteps([]);
    setAnswers(null);

    void (async () => {
      try {
        const response = await fetch(
          `/api/admin/engin/clients/${encodeURIComponent(clientId)}/onboarding`,
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof body.error === "string"
              ? body.error
              : "Impossible de charger l'onboarding",
          );
        }
        if (!cancelled) {
          setSteps((body.steps ?? []) as OnboardingStepStatus[]);
          setAnswers((body.answers ?? null) as ClientOnboardingAnswers | null);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setAnswers(null);
          toast({
            variant: "destructive",
            title: "Onboarding indisponible",
            description:
              error instanceof Error ? error.message : "Une erreur est survenue.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Séquence d&apos;onboarding</SheetTitle>
          <SheetDescription>
            {clientLabel ?? "Client"} — emails payment_onboarding_1…9
          </SheetDescription>
        </SheetHeader>

        {answers ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium">Réponses</p>
            <p className="text-sm text-muted-foreground">
              Prénom : {answers.firstName ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Visio : {answers.videoConference ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              Démarrage immédiat :{" "}
              {answers.startNow === null ? "—" : answers.startNow ? "oui" : "non"}
            </p>
            <p className="text-sm text-muted-foreground">
              Indisponibilités : {answers.unavailability ?? "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              CGV : {answers.cgvVersion ?? "—"}
              {answers.cgvAcceptedAt
                ? ` · ${formatWhen(answers.cgvAcceptedAt)}`
                : ""}
            </p>
            <Button variant="link" size="sm" className="h-auto justify-start px-0" asChild>
              <a href={answers.dashboardPath} target="_blank" rel="noreferrer">
                {answers.dashboardPath}
              </a>
            </Button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <ul className="flex flex-col gap-3 overflow-y-auto pr-1">
            {steps.map((step) => (
              <li
                key={step.emailType}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      E{step.stepIndex} · {step.emailType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Planifié : {formatWhen(step.scheduledFor)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Envoyé : {formatWhen(step.sentAt)}
                    </p>
                    {step.errorMessage ? (
                      <p className="text-xs text-destructive">{step.errorMessage}</p>
                    ) : null}
                  </div>
                  {statusBadge(step.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
