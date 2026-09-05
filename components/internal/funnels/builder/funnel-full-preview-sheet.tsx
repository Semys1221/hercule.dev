"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { DefaultSplitLayout } from "@/components/funnels/layouts/default-split";
import { FormStepPreview } from "@/components/funnels/presets/form-step";
import { QuestionStepPreview } from "@/components/funnels/presets/question-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FunnelCatalog } from "@/lib/admin/funnels/catalog-types";
import { DEFAULT_LAYOUT_ID } from "@/lib/admin/funnels/catalog-types";
import type { FunnelDocument, FunnelStep } from "@/lib/admin/funnels/schema";

type FunnelFullPreviewSheetProps = {
  funnel: FunnelDocument;
  catalog: FunnelCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function stepFieldLabels(
  step: FunnelStep,
  catalog: FunnelCatalog,
): string[] | undefined {
  if (step.preset !== "form" || !step.form) {
    return undefined;
  }

  const labelById = new Map(
    catalog.formFieldCatalog.map((field) => [field.id, field.label]),
  );

  return step.form.fields
    .filter((field) => field.enabled)
    .map((field) => labelById.get(field.id) ?? field.id);
}

function StepPreviewContent({
  step,
  catalog,
}: {
  step: FunnelStep;
  catalog: FunnelCatalog;
}) {
  const preset = step.preset ?? "question";

  if (preset === "other") {
    return (
      <p className="text-sm text-muted-foreground">
        {step.other?.intent ?? "Composant custom — brief Cursor."}
      </p>
    );
  }

  if (preset === "question") {
    return (
      <QuestionStepPreview
        prompt={step.question?.prompt}
        answers={step.question?.answers.map((answer) => answer.label)}
      />
    );
  }

  return <FormStepPreview fields={stepFieldLabels(step, catalog)?.map((label) => ({ label }))} />;
}

export function FunnelFullPreviewSheet({
  funnel,
  catalog,
  open,
  onOpenChange,
}: FunnelFullPreviewSheetProps) {
  const steps = funnel.steps;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open, funnel.slug]);

  const layout = useMemo(() => {
    const layoutId = funnel.layoutId ?? DEFAULT_LAYOUT_ID;
    return catalog.layouts.find((entry) => entry.id === layoutId) ?? catalog.layouts[0];
  }, [catalog.layouts, funnel.layoutId]);

  const currentStep = steps[stepIndex] ?? null;
  const totalSteps = steps.length;
  const progress =
    totalSteps === 0 ? 0 : Math.round(((stepIndex + 1) / totalSteps) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {funnel.displayName}
            <Badge variant={funnel.status === "published" ? "default" : "secondary"}>
              {funnel.status}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {funnel.publicPath}
            {totalSteps > 0
              ? ` · étape ${stepIndex + 1} / ${totalSteps}`
              : " · aucune étape mappée"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
          {totalSteps === 0 ? (
            <DefaultSplitLayout
              title="Layout sélectionné"
              stepLabel={layout?.label ?? "Layout"}
              progress={0}
            >
              <p className="text-sm text-muted-foreground">
                Mappez des étapes pour prévisualiser le parcours complet.
              </p>
            </DefaultSplitLayout>
          ) : currentStep ? (
            <DefaultSplitLayout
              title={currentStep.name}
              stepLabel={`Étape ${stepIndex + 1} sur ${totalSteps}`}
              progress={progress}
            >
              <StepPreviewContent step={currentStep} catalog={catalog} />
            </DefaultSplitLayout>
          ) : null}
        </div>

        {totalSteps > 1 ? (
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={stepIndex >= totalSteps - 1}
              onClick={() =>
                setStepIndex((index) => Math.min(totalSteps - 1, index + 1))
              }
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
