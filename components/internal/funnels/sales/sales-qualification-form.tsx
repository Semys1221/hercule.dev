"use client";

import { useEffect, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  interpolateQuestionCopy,
  resolveClientSegment,
  sanitizeComptableQ11Selection,
} from "@/lib/admin/funnels/client-segment";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import {
  getCoachScriptForQuestion,
  requiresO3FollowUp,
} from "@/lib/admin/funnels/sales-coach-scripts";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import {
  buildBleedTrack,
  interpolateBleed,
  type O3DurationId,
} from "@/lib/admin/funnels/sales-bleed-track";
import {
  B3_YEAR_MAP,
  formatCabinetBleedInterpolation,
  getB5bOptions,
  getB7Options,
  getCabinetSliderConfig,
  isBleedQuestionVisible,
  resolvePrimaryMethodId,
} from "@/lib/admin/funnels/sales-bleed-tunnel";
import {
  SALES_SKIP_VALUE,
  mergeSalesQualificationValues,
  type ConditionalSliderValue,
  type Q14Matrix,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import {
  COMPTABLE_ANNUAL_MIN,
} from "@/components/internal/funnels/sales/sales-questions-comptable";
import { CIF_ANNUAL_MIN } from "@/components/internal/funnels/sales/sales-questions-cif";

import type { Audience } from "@/lib/admin/navigation";

import { SalesCoachCallout } from "./sales-coach-callout";
import {
  SalesAcknowledgmentField,
  SalesCoachCue,
  SalesConditionalSliderField,
  SalesDiagnosticCardField,
  SalesMultiChoiceField,
  SalesO3DurationChipsField,
  SalesSingleChoiceField,
  SalesSliderField,
  SalesSliderMatrixField,
} from "./sales-question-fields";
import { getSalesQuestionsForSection } from "./sales-questions";
import type { SalesConditionalSliderQuestion, SalesQuestion } from "./sales-questions";
import type { SalesFunnelSection } from "./sales-funnel-sections";

const COMPACT_CARD_CLASS = `${RESERVATION_SURFACE} gap-0 py-0 shadow-none`;
const COMPACT_ROW_CLASS = "px-5 py-5 md:px-6 md:py-6";

type SalesQualificationFormProps = {
  audience: Audience;
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
  prospectFirstName?: string;
};

export function SalesQualificationForm({
  audience,
  section,
  form,
  prospectFirstName = "vous",
}: SalesQualificationFormProps) {
  const watchedValues = mergeSalesQualificationValues(
    useWatch({ control: form.control }) as Partial<SalesQualificationValues>,
    audience,
  );
  const watchedQ11 = useWatch({ control: form.control, name: "q11" }) as string[] | undefined;
  const clientSegment = useMemo(
    () => resolveClientSegment(watchedQ11 ?? watchedValues.q11),
    [watchedQ11, watchedValues.q11],
  );
  const showCoachScripts = isCabinetBuyerSalesAudience(audience);
  const isLinearBleedAudience = audience === "agence" || audience === "entreprise";
  const cabinetAudience = audience === "cif" ? "cif" : "comptable";
  const bleedTrack = useMemo(
    () => buildBleedTrack(watchedValues, audience),
    [audience, watchedValues],
  );
  const annualHonorairesMin =
    audience === "cif" ? CIF_ANNUAL_MIN : audience === "comptable" ? COMPTABLE_ANNUAL_MIN : undefined;

  useEffect(() => {
    if (audience !== "comptable") {
      return;
    }

    const current = form.getValues("q11") ?? [];
    const sanitized = sanitizeComptableQ11Selection(current);
    if (sanitized.length !== current.length) {
      form.setValue("q11", sanitized, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [audience, form, watchedQ11]);

  useEffect(() => {
    if (!showCoachScripts || !watchedValues.b3) {
      return;
    }
    const year = B3_YEAR_MAP[watchedValues.b3];
    if (year && watchedValues.b3Year !== year) {
      form.setValue("b3Year", year, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, showCoachScripts, watchedValues.b3, watchedValues.b3Year]);

  useEffect(() => {
    if (!showCoachScripts) {
      return;
    }
    const b5Count = watchedValues.b5?.length ?? 0;
    if (b5Count <= 1 && watchedValues.b5b) {
      form.setValue("b5b", undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, showCoachScripts, watchedValues.b5, watchedValues.b5b]);

  if (section.id === "rendez-vous" || section.id === "introduction") {
    return null;
  }

  const questions = getSalesQuestionsForSection(section.id, audience)
    .map((question) => applyQuestionSegmentCopy(question, clientSegment))
    .map((question) => applyBleedQuestionCopy(question, bleedTrack))
    .filter((question) => isQuestionVisible(question, watchedValues, showCoachScripts));

  return (
    <div className="space-y-5">
      <Card className={COMPACT_CARD_CLASS}>
        <CardContent className="divide-y divide-border p-0">
          {questions.map((question) => (
            <div key={question.id} className={COMPACT_ROW_CLASS}>
              {question.type === "single" ? (
                <FormField
                  control={form.control}
                  name={question.id as keyof SalesQualificationValues}
                  render={({ field }) => {
                    const singleValue = typeof field.value === "string" ? field.value : "";
                    const resolvedQuestion =
                      question.id === "b5b"
                        ? { ...question, options: getB5bOptions(watchedValues).map((o) => ({ ...o })) }
                        : question.id === "b7"
                          ? {
                              ...question,
                              options: getB7Options(resolvePrimaryMethodId(watchedValues)).map(
                                (o) => ({ ...o }),
                              ),
                              prompt: formatCabinetBleedInterpolation(
                                question.prompt,
                                watchedValues,
                                cabinetAudience,
                              ),
                            }
                          : question.id === "b8"
                            ? {
                                ...question,
                                prompt: formatCabinetBleedInterpolation(
                                  question.prompt,
                                  watchedValues,
                                  cabinetAudience,
                                ),
                              }
                            : question;

                    return (
                      <FormItem>
                        <SalesSingleChoiceField
                          question={resolvedQuestion}
                          value={singleValue}
                          onChange={field.onChange}
                        />
                        {question.coachCue &&
                        singleValue &&
                        (!question.showCoachCueWhen ||
                          question.showCoachCueWhen.includes(singleValue)) ? (
                          <SalesCoachCue cue={question.coachCue} />
                        ) : null}
                        {isLinearBleedAudience &&
                        section.id === "objectifs" &&
                        question.id === "o3" &&
                        singleValue ? (
                          <FormField
                            control={form.control}
                            name="o3Duration"
                            render={({ field }) => (
                              <FormItem>
                                <SalesO3DurationChipsField
                                  value={field.value as O3DurationId | undefined}
                                  onChange={field.onChange}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              ) : null}

              {question.type === "multi" ? (
                <FormField
                  control={form.control}
                  name={question.id as keyof SalesQualificationValues}
                  render={({ field }) => (
                    <FormItem>
                      <SalesMultiChoiceField
                        question={question}
                        value={Array.isArray(field.value) ? field.value : []}
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
                      {question.id === "q21" &&
                      question.coachCue &&
                      Array.isArray(field.value) &&
                      field.value.length > 0 &&
                      question.type === "multi" ? (
                        <SalesCoachCue
                          cue={resolveQ21CoachCue(
                            question.coachCue,
                            field.value,
                            question.options,
                            bleedTrack,
                          )}
                        />
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {question.type === "slider" ? (
                <FormField
                  control={form.control}
                  name={question.id as keyof SalesQualificationValues}
                  render={({ field }) => {
                    const numericValue = typeof field.value === "number" ? field.value : null;
                    const role = question.id === "b4" ? "target" : "current";
                    const sliderConfig =
                      question.id === "b2" || question.id === "b4"
                        ? getCabinetSliderConfig(watchedValues.b1, role, cabinetAudience)
                        : undefined;
                    const alertMessage =
                      question.id === "b4" &&
                      typeof watchedValues.b2 === "number" &&
                      typeof numericValue === "number" &&
                      numericValue <= watchedValues.b2
                        ? "Objectif ≤ actuel — vérifiez la cible H."
                        : undefined;

                    return (
                      <FormItem>
                        <SalesSliderField
                          question={question}
                          value={numericValue}
                          onChange={field.onChange}
                          sliderConfig={sliderConfig}
                          alertMessage={alertMessage}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
                        value={field.value as Q14Matrix}
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

              {question.type === "acknowledgment" ? (
                <FormField
                  control={form.control}
                  name="b6Acknowledged"
                  render={({ field }) => (
                    <FormItem>
                      <SalesAcknowledgmentField
                        question={question}
                        trapText={formatCabinetBleedInterpolation(
                          question.trapTemplate,
                          watchedValues,
                          cabinetAudience,
                        )}
                        acknowledged={field.value ?? false}
                        onAcknowledgedChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {question.type === "diagnostic_card" ? (
                <FormField
                  control={form.control}
                  name="bleedDiagnosticAccepted"
                  render={({ field }) => (
                    <FormItem>
                      <SalesDiagnosticCardField
                        question={question}
                        mirrorText={
                          showCoachScripts
                            ? formatCabinetBleedInterpolation(
                                question.mirrorTemplate,
                                watchedValues,
                                cabinetAudience,
                              )
                            : interpolateBleed(question.mirrorTemplate, bleedTrack)
                        }
                        accepted={field.value ?? false}
                        onAcceptedChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {showCoachScripts && section.id !== "objectifs" ? (
                <QuestionCoachCallout
                  audience={audience}
                  question={question}
                  prospectFirstName={prospectFirstName}
                  clientSegment={clientSegment}
                  values={watchedValues}
                  annualHonorairesMin={annualHonorairesMin}
                  bleedCause={bleedTrack.cause}
                />
              ) : null}

              {showCoachScripts && section.id === "objectifs" && question.id === "o3" && requiresO3FollowUp(watchedValues.o3) ? (
                <FormField
                  control={form.control}
                  name="o3FollowUp"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Mémo commercial — depuis combien de temps ?</FormLabel>
                      <FormDescription>
                        Note interne pour le closer — non visible par le prospect.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Ex. 6 mois, depuis la dernière campagne locale…"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function isQuestionVisible(
  question: SalesQuestion,
  values: SalesQualificationValues,
  isCabinet: boolean,
): boolean {
  if (!isCabinet) {
    return true;
  }
  if (!question.id.startsWith("b") && question.id !== "diagnostic_card") {
    return true;
  }
  return isBleedQuestionVisible(question.id, values);
}

function QuestionCoachCallout({
  audience,
  question,
  prospectFirstName,
  clientSegment,
  values,
  annualHonorairesMin,
  bleedCause,
}: {
  audience: Audience;
  question: SalesQuestion;
  prospectFirstName: string;
  clientSegment: ReturnType<typeof resolveClientSegment>;
  values: SalesQualificationValues;
  annualHonorairesMin?: number;
  bleedCause?: string;
}) {
  const coachQuestionIds = new Set(["o3", "o4", "o6", "q21", "q13"]);
  if (!coachQuestionIds.has(question.id)) {
    return null;
  }

  const script = getCoachScriptForQuestion(
    {
      audience,
      firstName: prospectFirstName,
      clientSegment,
      questionId: question.id,
      selectedOptionIds:
        question.id === "o4"
          ? values.o4
          : question.id === "q21"
            ? values.q21
            : undefined,
      sliderValue: question.id === "q13" ? values.q13 : undefined,
      o3Value: values.o3,
      o6Value: values.o6,
      bleedCause,
    },
    annualHonorairesMin,
  );

  if (!script) {
    return null;
  }

  return <SalesCoachCallout script={script} className="mt-4" />;
}

function applyQuestionSegmentCopy(question: SalesQuestion, clientSegment: ReturnType<typeof resolveClientSegment>) {
  if (question.id === "q11") {
    return question;
  }

  return interpolateQuestionCopy(question, clientSegment);
}

const BLEED_EXCLUDED_QUESTION_IDS = new Set(["q1", "q2"]);

function applyBleedQuestionCopy(
  question: SalesQuestion,
  bleedTrack: ReturnType<typeof buildBleedTrack>,
): SalesQuestion {
  if (BLEED_EXCLUDED_QUESTION_IDS.has(question.id)) {
    return question;
  }

  const resolve = (template?: string) =>
    template ? interpolateBleed(template, bleedTrack) : undefined;

  return {
    ...question,
    prompt: resolve(question.prompt) ?? question.prompt,
    description: resolve(question.description) ?? question.description,
    coachCue: resolve(question.coachCue) ?? question.coachCue,
    bleedBenefit: resolve(question.bleedBenefit) ?? question.bleedBenefit,
  };
}

function resolveQ21CoachCue(
  template: string,
  selectedIds: string[],
  options: Array<{ id: string; label: string }>,
  bleedTrack: ReturnType<typeof buildBleedTrack>,
): string {
  const atout = options.find((option) => option.id === selectedIds[0])?.label ?? "";
  return interpolateBleed(template.replace(/\{atout\}/g, atout), bleedTrack);
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
