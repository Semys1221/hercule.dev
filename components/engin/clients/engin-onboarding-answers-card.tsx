"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientOnboardingAnswers } from "@/lib/clients/onboarding-answers";

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

type EnginOnboardingAnswersCardProps = {
  answers: ClientOnboardingAnswers;
};

export function EnginOnboardingAnswersCard({ answers }: EnginOnboardingAnswersCardProps) {
  const completed = Boolean(answers.onboardingCompletedAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réponses onboarding</CardTitle>
        <CardDescription>
          Données enregistrées dans{" "}
          <code className="text-xs">clients.profile</code> et colonnes associées.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {!completed ? (
          <p className="text-muted-foreground">Onboarding non complété par le client.</p>
        ) : null}
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Prénom</dt>
            <dd className="font-medium">{answers.firstName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Visioconférence</dt>
            <dd>{answers.videoConference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Indisponibilités</dt>
            <dd className="whitespace-pre-wrap">{answers.unavailability ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Démarrage / rétractation</dt>
            <dd>{answers.retractionChoice ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Démarrage immédiat (bool)</dt>
            <dd>
              {answers.startNow === null ? "—" : answers.startNow ? "oui" : "non"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">CGV</dt>
            <dd>
              {answers.cgvVersion ?? "—"}
              {answers.cgvAcceptedAt
                ? ` · ${formatWhen(answers.cgvAcceptedAt)}`
                : ""}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Onboarding complété le</dt>
            <dd>{formatWhen(answers.onboardingCompletedAt)}</dd>
          </div>
        </dl>
        <Button variant="link" size="sm" className="h-auto justify-start px-0" asChild>
          <Link href={answers.dashboardPath} target="_blank" rel="noreferrer">
            Ouvrir le dashboard client
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
