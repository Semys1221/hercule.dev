"use client";

import { PanelLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { B3_YEAR_MAP } from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  formatObjectifsWizardInterpolation,
  getDefaultWizardChartMetric,
  getW4Prompt,
  getW6Prompt,
  getW7Prompt,
  getW8BrakeOptions,
  getWizardChartMetricForQuestion,
  getWizardFormFieldName,
  getWizardSliderConfig,
  getVisibleWizardQuestionIds,
  isWizardFieldComplete,
  isWizardStepVisible,
  type WizardChartMetricId,
} from "@/lib/admin/funnels/sales-objectifs-wizard";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

import {
  SalesObjectifsWizardChart,
} from "./sales-objectifs-wizard-chart";
import {
  SalesAcknowledgmentField,
  SalesCoachCue,
  SalesConfirmationMirrorField,
  SalesDiagnosticCardField,
  SalesMultiChoiceField,
  SalesSingleChoiceField,
  SalesSliderField,
  SalesTextField,
} from "./sales-question-fields";
import { getSalesQuestionsForSection } from "./sales-questions";
import type { SalesQuestion } from "./sales-questions";

type SalesObjectifsWizardProps = {
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  immersive?: boolean;
  onOpenSidebar?: () => void;
};

export function SalesObjectifsWizard({
  audience,
  form,
  immersive = false,
  onOpenSidebar,
}: SalesObjectifsWizardProps) {
  const watchedPartial = useWatch({ control: form.control });
  const values = mergeSalesQualificationValues(
    watchedPartial as Partial<SalesQualificationValues>,
    audience,
  );

  const allQuestions = getSalesQuestionsForSection("objectifs", audience);
  const visibleQuestionIds = useMemo(
    () => getVisibleWizardQuestionIds(values),
    [values],
  );
  const visibleQuestions = useMemo(
    () =>
      visibleQuestionIds
        .map((id) => allQuestions.find((question) => question.id === id))
        .filter((question): question is SalesQuestion => Boolean(question)),
    [allQuestions, visibleQuestionIds],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [touchedSliders, setTouchedSliders] = useState<Set<string>>(() => new Set());
  const [chartMetricId, setChartMetricId] = useState<WizardChartMetricId>(() =>
    getDefaultWizardChartMetric(values),
  );

  const markSliderTouched = (questionId: string) => {
    setTouchedSliders((previous) => {
      if (previous.has(questionId)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(questionId);
      return next;
    });
  };
  const safeStepIndex = Math.min(stepIndex, Math.max(visibleQuestions.length - 1, 0));
  const currentQuestion = visibleQuestions[safeStepIndex];
  const progressValue =
    visibleQuestions.length > 0
      ? ((safeStepIndex + 1) / visibleQuestions.length) * 100
      : 0;

  useEffect(() => {
    if (stepIndex > visibleQuestions.length - 1) {
      setStepIndex(Math.max(visibleQuestions.length - 1, 0));
    }
  }, [stepIndex, visibleQuestions.length]);

  useEffect(() => {
    if (values.w10 && values.w10 in B3_YEAR_MAP) {
      const year = B3_YEAR_MAP[values.w10];
      if (year && values.w10Year !== year) {
        form.setValue("w10Year", year, { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [form, values.w10, values.w10Year]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }
    const metricForQuestion = getWizardChartMetricForQuestion(currentQuestion.id);
    if (metricForQuestion) {
      setChartMetricId(metricForQuestion);
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (values.w8Tried === "none" && values.w8TriedWho) {
      form.setValue("w8TriedWho", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [form, values.w8Tried, values.w8TriedWho]);

  useEffect(() => {
    if (!values.w8 || !values.w8Brake) {
      return;
    }
    const validIds = getW8BrakeOptions(values).map((option) => option.id);
    if (!validIds.includes(values.w8Brake)) {
      form.setValue("w8Brake", undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, values.w8, values.w8Brake]);

  const resolvedQuestion = currentQuestion
    ? resolveWizardQuestionCopy(currentQuestion, values, audience)
    : null;

  const canGoNext = currentQuestion
    ? isWizardFieldComplete(currentQuestion.id, values, {
        touchedSliderFields: touchedSliders,
      })
    : false;
  const canGoPrev = safeStepIndex > 0;

  if (immersive) {
    return (
      <div className="relative flex h-full min-h-0 flex-col bg-background">
        <Progress value={progressValue} className="h-px shrink-0 rounded-none" />

        {onOpenSidebar ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-3 top-3 z-10 size-9 text-muted-foreground hover:text-foreground"
            aria-label="Ouvrir le menu des étapes"
            onClick={onOpenSidebar}
          >
            <PanelLeft className="size-4" />
          </Button>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-4">
          <SalesObjectifsWizardChart
            audience={audience}
            values={values}
            metricId={chartMetricId}
            onMetricChange={setChartMetricId}
            variant="hero"
          />
        </div>

        <div className="shrink-0 border-t border-border/40 px-6 py-6 md:px-10 md:py-8">
          {resolvedQuestion ? (
            <WizardQuestionField
              audience={audience}
              form={form}
              question={resolvedQuestion}
              values={values}
              onSliderTouched={markSliderTouched}
            />
          ) : null}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canGoPrev}
              onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
            >
              Précédent
            </Button>
            <Button
              type="button"
              disabled={!canGoNext || safeStepIndex >= visibleQuestions.length - 1}
              onClick={() =>
                setStepIndex((index) => Math.min(index + 1, visibleQuestions.length - 1))
              }
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Étape {safeStepIndex + 1} / {visibleQuestions.length}
          </span>
          <span>{Math.round(progressValue)} %</span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start">
        <div className="order-2 lg:order-1">
          {resolvedQuestion ? (
            <WizardQuestionField
              audience={audience}
              form={form}
              question={resolvedQuestion}
              values={values}
              onSliderTouched={markSliderTouched}
            />
          ) : null}
        </div>

        <div className="order-1 lg:sticky lg:top-4 lg:order-2">
          <SalesObjectifsWizardChart
            audience={audience}
            values={values}
            metricId={chartMetricId}
            onMetricChange={setChartMetricId}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!canGoPrev}
          onClick={() => setStepIndex((index) => Math.max(index - 1, 0))}
        >
          Précédent
        </Button>
        <Button
          type="button"
          disabled={!canGoNext || safeStepIndex >= visibleQuestions.length - 1}
          onClick={() =>
            setStepIndex((index) => Math.min(index + 1, visibleQuestions.length - 1))
          }
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export function resolveWizardQuestionCopy(
  question: SalesQuestion,
  values: SalesQualificationValues,
  audience: Audience,
): SalesQuestion {
  if (question.id === "w4") {
    return { ...question, prompt: getW4Prompt(values, audience) };
  }

  if (question.id === "w6") {
    return { ...question, prompt: getW6Prompt(audience) };
  }

  if (question.id === "w7") {
    return { ...question, prompt: getW7Prompt() };
  }

  if (question.id === "w8Brake" && question.type === "single") {
    const interpolate = (text: string) =>
      formatObjectifsWizardInterpolation(text, values, audience);
    return {
      ...question,
      prompt: interpolate(question.prompt),
      options: getW8BrakeOptions(values).map((option) => ({ ...option })),
    };
  }

  const interpolate = (text: string) =>
    formatObjectifsWizardInterpolation(text, values, audience);

  if (
    question.type === "single" ||
    question.type === "slider" ||
    question.type === "text" ||
    question.type === "multi"
  ) {
    return {
      ...question,
      prompt: interpolate(question.prompt),
      description: question.description ? interpolate(question.description) : question.description,
    };
  }

  if (
    question.type === "acknowledgment" ||
    question.type === "confirmation_mirror" ||
    question.type === "diagnostic_card"
  ) {
    return question;
  }

  return question;
}

type WizardQuestionFieldProps = {
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  question: SalesQuestion;
  values: SalesQualificationValues;
  onSliderTouched: (questionId: string) => void;
  variant?: "default" | "immersive";
};

export function WizardQuestionField({
  audience,
  form,
  question,
  values,
  onSliderTouched,
  variant = "default",
}: WizardQuestionFieldProps) {
  const interpolate = (template: string) =>
    formatObjectifsWizardInterpolation(template, values, audience);

  if (question.type === "multi") {
    const fieldName = getWizardFormFieldName(question.id);
    if (!fieldName) {
      return null;
    }

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <SalesMultiChoiceField
              question={question}
              value={Array.isArray(field.value) ? field.value : []}
              onChange={field.onChange}
              variant={variant}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (question.type === "single") {
    const fieldName = getWizardFormFieldName(question.id);
    if (!fieldName) {
      return null;
    }

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => {
          const singleValue = typeof field.value === "string" ? field.value : "";
          return (
            <FormItem>
              <SalesSingleChoiceField
                question={question}
                value={singleValue}
                onChange={field.onChange}
                variant={variant}
              />
              {question.coachCue && singleValue ? (
                <SalesCoachCue cue={interpolate(question.coachCue)} />
              ) : null}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  if (question.type === "slider") {
    const fieldName = getWizardFormFieldName(question.id);
    if (!fieldName) {
      return null;
    }

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => {
          const hasValue = typeof field.value === "number";
          const displayValue = hasValue
            ? field.value
            : getWizardSliderConfig(question.id, audience).defaultValue;
          const alertMessage = (() => {
            if (!hasValue) {
              return undefined;
            }
            if (
              question.id === "w5" &&
              typeof values.w3 === "number" &&
              field.value <= values.w3
            ) {
              return "Objectif ≤ actuel — vérifiez la cible.";
            }
            if (
              question.id === "w6" &&
              typeof values.w4 === "number" &&
              field.value <= values.w4
            ) {
              return "Objectif ≤ actuel — vérifiez la cible.";
            }
            if (
              question.id === "w7" &&
              typeof values.w2 === "number" &&
              field.value <= values.w2
            ) {
              return "Objectif ≤ actuel — vérifiez la cible.";
            }
            return undefined;
          })();

          return (
            <FormItem>
              <SalesSliderField
                question={question}
                value={displayValue}
                onChange={(next) => {
                  onSliderTouched(question.id);
                  field.onChange(next);
                }}
                sliderConfig={getWizardSliderConfig(question.id, audience)}
                alertMessage={alertMessage}
                variant={variant}
              />
              {question.coachCue ? (
                <SalesCoachCue cue={interpolate(question.coachCue)} />
              ) : null}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }

  if (question.type === "text") {
    const fieldName = getWizardFormFieldName(question.id);
    if (!fieldName) {
      return null;
    }

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <SalesTextField
              question={question}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (question.type === "acknowledgment") {
    const fieldName =
      question.id === "w9" ? "w9Acknowledged" : "w17Acknowledged";

    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <SalesAcknowledgmentField
              question={question}
              trapText={interpolate(question.trapTemplate)}
              acknowledged={field.value ?? false}
              onAcknowledgedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (question.type === "confirmation_mirror") {
    return (
      <FormField
        control={form.control}
        name="w12Confirmed"
        render={({ field }) => (
          <FormItem>
            <SalesConfirmationMirrorField
              question={question}
              mirrorText={interpolate(question.mirrorTemplate)}
              confirmed={field.value ?? false}
              onConfirmedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (question.type === "diagnostic_card") {
    return (
      <FormField
        control={form.control}
        name="bleedDiagnosticAccepted"
        render={({ field }) => (
          <FormItem>
            <SalesDiagnosticCardField
              question={question}
              mirrorText={interpolate(question.mirrorTemplate)}
              accepted={field.value ?? false}
              onAcceptedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return null;
}

export { isWizardStepVisible };
