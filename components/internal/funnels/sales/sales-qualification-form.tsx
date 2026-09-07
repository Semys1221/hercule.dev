"use client";

import { useEffect } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import {
  SALES_SKIP_VALUE,
  mergeSalesQualificationValues,
  type ConditionalSliderValue,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";

import {
  SalesConditionalSliderField,
  SalesMultiChoiceField,
  SalesSingleChoiceField,
  SalesSliderField,
  SalesSliderMatrixField,
} from "./sales-question-fields";
import { getSalesQuestionsForSection } from "./sales-questions";
import type { SalesConditionalSliderQuestion } from "./sales-questions";
import type { SalesFunnelSection } from "./sales-funnel-sections";

const COMPACT_CARD_CLASS = `${RESERVATION_SURFACE} gap-0 py-0 shadow-none`;
const COMPACT_ROW_CLASS = "px-5 py-5 md:px-6 md:py-6";

type SalesQualificationFormProps = {
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesQualificationForm({ section, form }: SalesQualificationFormProps) {
  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
  );

  if (section.id === "rendez-vous" || section.id === "introduction") {
    return null;
  }

  const questions = getSalesQuestionsForSection(section.id);

  return (
    <Card className={COMPACT_CARD_CLASS}>
      <CardContent className="divide-y divide-border p-0">
        {questions.map((question) => (
          <div key={question.id} className={COMPACT_ROW_CLASS}>
            {question.type === "single" ? (
              <FormField
                control={form.control}
                name={question.id as "q4"}
                render={({ field }) => (
                  <FormItem>
                    <SalesSingleChoiceField
                      question={question}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {question.type === "multi" ? (
              <FormField
                control={form.control}
                name={question.id as "q1"}
                render={({ field }) => (
                  <FormItem>
                    <SalesMultiChoiceField
                      question={question}
                      value={field.value}
                      onChange={field.onChange}
                      otherValue={
                        question.hasOtherInput ? form.watch("q2Other") : undefined
                      }
                      onOtherChange={
                        question.hasOtherInput
                          ? (value) =>
                              form.setValue("q2Other", value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                          : undefined
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {question.type === "slider" ? (
              <FormField
                control={form.control}
                name={question.id as "q3" | "q6" | "q7" | "q13" | "q20"}
                render={({ field }) => (
                  <FormItem>
                    <SalesSliderField
                      question={question}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {question.type === "slider_matrix" ? (
              <FormField
                control={form.control}
                name="q14"
                render={({ field }) => (
                  <FormItem>
                    <SalesSliderMatrixField
                      question={question}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {question.type === "conditional_slider" ? (
              <ConditionalSliderQuestionField
                form={form}
                question={question}
                values={watchedValues}
              />
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConditionalSliderQuestionField({
  form,
  question,
  values,
}: {
  form: UseFormReturn<SalesQualificationValues>;
  question: SalesConditionalSliderQuestion;
  values: SalesQualificationValues;
}) {
  const fieldName = question.id as "q15" | "q16" | "q17" | "q18";
  const hidden = isConditionalSliderQuestionHidden(question, values);

  useEffect(() => {
    if (!question.dependsOn) {
      return;
    }

    const parentValue = values[
      question.dependsOn as "q15" | "q17"
    ] as ConditionalSliderValue;
    const current = form.getValues(fieldName) as ConditionalSliderValue;

    if (parentValue === SALES_SKIP_VALUE) {
      if (current !== SALES_SKIP_VALUE) {
        form.setValue(fieldName, SALES_SKIP_VALUE, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      return;
    }

    if (current === SALES_SKIP_VALUE && typeof parentValue === "number") {
      form.setValue(fieldName, question.slider.defaultValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [fieldName, form, question.dependsOn, question.slider.defaultValue, values]);

  if (hidden) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <SalesConditionalSliderField
            question={question}
            value={field.value as ConditionalSliderValue}
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function isConditionalSliderQuestionHidden(
  question: { dependsOn?: string },
  values: SalesQualificationValues,
): boolean {
  if (!question.dependsOn) {
    return false;
  }

  const parentValue = values[
    question.dependsOn as "q15" | "q17"
  ] as ConditionalSliderValue;

  if (parentValue === SALES_SKIP_VALUE) {
    return true;
  }

  return typeof parentValue !== "number";
}
