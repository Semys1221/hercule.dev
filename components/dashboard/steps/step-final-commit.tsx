"use client";

import { ArrowRight } from "lucide-react";

import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import { getFinalCommitCta } from "@/lib/dashboard/onboarding-faq";

type StepFinalCommitProps = {
  bleedContext?: DashboardBleedContext;
  onConfirm: () => void;
};

export function StepFinalCommit({ bleedContext, onConfirm }: StepFinalCommitProps) {
  const cta = getFinalCommitCta(bleedContext);
  const bleed = bleedContext?.bleed;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium">Dernière étape</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          L&apos;infrastructure est cadrée — il reste à activer le déploiement sur votre zone.
        </p>
      </div>

      {bleed ? (
        <div className="flex flex-wrap gap-2">
          {bleed.cause ? (
            <Badge variant="outline" className="text-xs">
              {bleed.cause}
            </Badge>
          ) : null}
          {bleed.gap ? (
            <Badge variant="outline" className="text-xs">
              Écart : {bleed.gap}
            </Badge>
          ) : null}
          {bleedContext?.zone ? (
            <Badge variant="secondary" className="text-xs">
              Zone : {bleedContext.zone}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-muted/20 p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <FaqRichText text={cta.description} />
        </p>
      </div>

      <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onConfirm}>
        {cta.label}
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}
