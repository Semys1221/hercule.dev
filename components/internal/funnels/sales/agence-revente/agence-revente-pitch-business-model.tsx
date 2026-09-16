"use client";

import {
  Banknote,
  Calendar,
  Cpu,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  BUSINESS_MODEL_STEPS,
  type BusinessModelIcon,
} from "./agence-revente-pitch-steps";

const BUSINESS_MODEL_ICONS: Record<BusinessModelIcon, LucideIcon> = {
  cpu: Cpu,
  banknote: Banknote,
  calendar: Calendar,
  userCheck: UserCheck,
};

type AgenceReventePitchBusinessModelProps = {
  mode: "intro" | "step";
  stepIndex?: number;
  animate?: boolean;
};

function BusinessModelStepRow({
  stepIndex,
  animate,
}: {
  stepIndex: number;
  animate: boolean;
}) {
  const step = BUSINESS_MODEL_STEPS[stepIndex];
  const Icon = BUSINESS_MODEL_ICONS[step.icon];

  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg border border-border bg-card px-4 py-4",
        animate && "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500",
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted"
        aria-hidden
      >
        <Icon className="size-4 text-primary" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="font-medium text-foreground">{step.label}</p>
        {step.bullets ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {step.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        {step.tagline ? (
          <p className="text-sm font-medium text-primary">{step.tagline}</p>
        ) : null}
      </div>
    </div>
  );
}

export function AgenceReventePitchBusinessModel({
  mode,
  stepIndex = 0,
  animate = false,
}: AgenceReventePitchBusinessModelProps) {
  if (mode === "step") {
    return <BusinessModelStepRow stepIndex={stepIndex} animate={animate} />;
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground md:text-base">
          Nous sommes des exécutants et non une agence.
        </p>
        <p className="text-sm text-muted-foreground">
          Cinq étapes pour structurer le pipeline et le confier à un acheteur.
        </p>
      </CardContent>
    </Card>
  );
}
