"use client";

import { Badge } from "@/components/ui/badge";
import type { OnboardingStepStatus } from "@/lib/clients/engin-types";

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

type EnginOnboardingStepsListProps = {
  steps: OnboardingStepStatus[];
};

export function EnginOnboardingStepsList({ steps }: EnginOnboardingStepsListProps) {
  return (
    <ul className="flex flex-col gap-3">
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
  );
}
