"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

function resolveNextStepMessage(data: DashboardData): string {
  if (data.productStatut === "POST_RDV_SURVEY") {
    return "Rendez-vous effectué — suivi en cours.";
  }

  if (data.scheduledAt) {
    return "Votre prochain rendez-vous est planifié. Aucune action requise.";
  }

  const hasActiveTimelineStep = data.timeline.some((step) => step.status === "active");
  if (hasActiveTimelineStep) {
    return "Votre recherche est en cours — vous recevrez un email dès qu'une demande est disponible.";
  }

  return "Votre recherche est en cours — vous recevrez un email dès qu'une demande est disponible.";
}

type NextStepBlockProps = {
  data: DashboardData;
};

export function NextStepBlock({ data }: NextStepBlockProps) {
  const message = resolveNextStepMessage(data);

  return (
    <Card className="mt-6 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Prochaine étape</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
