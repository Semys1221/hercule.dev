"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { SALES_SKIP_VALUE } from "@/lib/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import {
  formatSliderLabel,
  formatSliderRange,
  type SalesConditionalSliderQuestion,
  type SalesMultiQuestion,
  type SalesQuestionOption,
  type SalesSingleQuestion,
  type SalesSliderConfig,
  type SalesSliderMatrixQuestion,
  type SalesSliderQuestion,
} from "./sales-questions";

const COMPACT_FIELD_SET = "gap-2";
const COMPACT_LEGEND = "mb-1 text-sm font-medium leading-snug";
const COMPACT_DESCRIPTION = "text-xs";
const CHOICE_GROUP_CLASS = "flex flex-row flex-wrap gap-1.5";
const CHOICE_CHIP_CLASS =
  "inline-flex w-auto shrink-0 items-center gap-1.5 rounded-sm border px-2 py-1";

function QuestionNumber({ number }: { number: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">Q{number}.</span>
  );
}

type SalesSingleChoiceFieldProps = {
  question: SalesSingleQuestion;
  value: string;
  onChange: (value: string) => void;
};

export function SalesSingleChoiceField({
  question,
  value,
  onChange,
}: SalesSingleChoiceFieldProps) {
  return (
    <FieldSet className={COMPACT_FIELD_SET}>
      <FieldLegend className={COMPACT_LEGEND}>
        <QuestionNumber number={question.number} /> {question.prompt}
      </FieldLegend>
      {question.description ? (
        <FieldDescription className={COMPACT_DESCRIPTION}>
          {question.description}
        </FieldDescription>
      ) : null}
      <RadioGroup value={value} onValueChange={onChange} className={CHOICE_GROUP_CLASS}>
        {question.options.map((option) => (
          <ChoiceChip key={option.id} option={option} groupId={question.id} />
        ))}
      </RadioGroup>
    </FieldSet>
  );
}

type SalesMultiChoiceFieldProps = {
  question: SalesMultiQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
};

export function SalesMultiChoiceField({
  question,
  value,
  onChange,
  otherValue = "",
  onOtherChange,
}: SalesMultiChoiceFieldProps) {
  const maxSelections = question.maxSelections;
  const exclusiveId = question.exclusiveOptionId;
  const atLimit = value.length >= maxSelections;

  function toggleOption(optionId: string, checked: boolean) {
    if (checked) {
      if (exclusiveId && optionId === exclusiveId) {
        onChange([optionId]);
        return;
      }

      if (exclusiveId && value.includes(exclusiveId)) {
        onChange([optionId]);
        return;
      }

      if (value.length >= maxSelections) {
        return;
      }

      onChange([...value, optionId]);
      return;
    }

    onChange(value.filter((id) => id !== optionId));
  }

  return (
    <FieldSet className={COMPACT_FIELD_SET}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLegend className={cn(COMPACT_LEGEND, "mb-0")}>
          <QuestionNumber number={question.number} /> {question.prompt}
        </FieldLegend>
        {question.description ? (
          <Badge variant="outline" className="h-5 px-1.5 text-xs font-normal">
            {value.length}/{maxSelections}
          </Badge>
        ) : null}
      </div>
      {question.description ? (
        <FieldDescription className={COMPACT_DESCRIPTION}>
          {question.description}
        </FieldDescription>
      ) : null}
      <FieldGroup data-slot="checkbox-group" className={CHOICE_GROUP_CLASS}>
        {question.options.map((option) => {
          const isChecked = value.includes(option.id);
          const isDisabled = !isChecked && atLimit;
          const inputId = `${question.id}-${option.id}`;

          return (
            <FieldLabel
              key={option.id}
              htmlFor={inputId}
              className={cn("inline-flex w-auto font-normal", isDisabled && "opacity-50")}
            >
              <Field orientation="horizontal" className={CHOICE_CHIP_CLASS}>
                <Checkbox
                  id={inputId}
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => toggleOption(option.id, checked === true)}
                />
                <span className="text-xs">{option.label}</span>
              </Field>
            </FieldLabel>
          );
        })}
      </FieldGroup>
      {question.hasOtherInput && value.includes("other") && onOtherChange ? (
        <Field>
          <FieldLabel htmlFor={`${question.id}-other-input`} className="text-xs">
            Précisez votre autre spécialité
          </FieldLabel>
          <Input
            id={`${question.id}-other-input`}
            className="h-8 text-sm"
            value={otherValue}
            onChange={(event) => onOtherChange(event.target.value)}
            placeholder="Ex. Motion design, print, événementiel…"
          />
        </Field>
      ) : null}
    </FieldSet>
  );
}

type SalesSliderFieldProps = {
  question: SalesSliderQuestion;
  value: number | null;
  onChange: (value: number | null) => void;
};

export function SalesSliderField({
  question,
  value,
  onChange,
}: SalesSliderFieldProps) {
  const { slider, optOutLabel } = question;
  const optedOut = value === null;
  const displayValue = optedOut ? slider.defaultValue : value;

  return (
    <FieldSet className={COMPACT_FIELD_SET}>
      <FieldLegend className={COMPACT_LEGEND}>
        <QuestionNumber number={question.number} /> {question.prompt}
      </FieldLegend>
      {question.description ? (
        <FieldDescription className={COMPACT_DESCRIPTION}>
          {question.description}
        </FieldDescription>
      ) : null}
      <SliderControl
        config={slider}
        value={displayValue}
        disabled={optedOut}
        onChange={(next) => onChange(next)}
      />
      {optOutLabel ? (
        <Field orientation="horizontal">
          <Checkbox
            id={`${question.id}-opt-out`}
            checked={optedOut}
            onCheckedChange={(checked) =>
              onChange(checked === true ? null : slider.defaultValue)
            }
          />
          <FieldLabel htmlFor={`${question.id}-opt-out`} className="text-xs font-normal">
            {optOutLabel}
          </FieldLabel>
        </Field>
      ) : null}
    </FieldSet>
  );
}

type SalesSliderMatrixFieldProps = {
  question: SalesSliderMatrixQuestion;
  value: {
    months3: number;
    months6: number;
    months12: number;
  };
  onChange: (value: {
    months3: number;
    months6: number;
    months12: number;
  }) => void;
};

export function SalesSliderMatrixField({
  question,
  value,
  onChange,
}: SalesSliderMatrixFieldProps) {
  return (
    <FieldSet className={COMPACT_FIELD_SET}>
      <FieldLegend className={COMPACT_LEGEND}>
        <QuestionNumber number={question.number} /> {question.prompt}
      </FieldLegend>
      {question.description ? (
        <FieldDescription className={COMPACT_DESCRIPTION}>
          {question.description}
        </FieldDescription>
      ) : null}
      <FieldGroup className="grid gap-3 sm:grid-cols-3">
        {question.subQuestions.map((subQuestion) => (
          <FieldSet key={subQuestion.id} className="gap-2">
            <FieldLegend variant="label" className="text-xs">
              {subQuestion.label}
            </FieldLegend>
            <SliderControl
              config={question.slider}
              value={value[subQuestion.id]}
              onChange={(next) =>
                onChange({
                  ...value,
                  [subQuestion.id]: next,
                })
              }
            />
          </FieldSet>
        ))}
      </FieldGroup>
    </FieldSet>
  );
}

type SalesConditionalSliderFieldProps = {
  question: SalesConditionalSliderQuestion;
  value: number | typeof SALES_SKIP_VALUE;
  onChange: (value: number | typeof SALES_SKIP_VALUE) => void;
};

export function SalesConditionalSliderField({
  question,
  value,
  onChange,
}: SalesConditionalSliderFieldProps) {
  const skipped = value === SALES_SKIP_VALUE;
  const skipId = `${question.id}-skip`;
  const displayValue =
    typeof value === "number" ? value : question.slider.defaultValue;

  return (
    <FieldSet className={COMPACT_FIELD_SET}>
      <FieldLegend className={COMPACT_LEGEND}>
        <QuestionNumber number={question.number} /> {question.prompt}
      </FieldLegend>
      {question.description ? (
        <FieldDescription className={COMPACT_DESCRIPTION}>
          {question.description}
        </FieldDescription>
      ) : null}
      <SliderControl
        config={question.slider}
        value={displayValue}
        disabled={skipped}
        onChange={(next) => onChange(next)}
      />
      <Field orientation="horizontal">
        <Checkbox
          id={skipId}
          checked={skipped}
          onCheckedChange={(checked) =>
            onChange(checked === true ? SALES_SKIP_VALUE : question.slider.defaultValue)
          }
        />
        <FieldLabel
          htmlFor={skipId}
          className="text-xs font-normal text-muted-foreground"
        >
          {question.skipLabel}
        </FieldLabel>
      </Field>
    </FieldSet>
  );
}

type SliderControlProps = {
  config: SalesSliderConfig;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function SliderControl({ config, value, disabled = false, onChange }: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium tabular-nums text-foreground">
          {formatSliderLabel(value, config.unit)}
        </span>
        <span className="text-xs text-muted-foreground">{formatSliderRange(config)}</span>
      </div>
      <Slider
        min={config.min}
        max={config.max}
        step={config.step}
        value={[value]}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

type ChoiceChipProps = {
  option: SalesQuestionOption;
  groupId: string;
};

function ChoiceChip({ option, groupId }: ChoiceChipProps) {
  const inputId = `${groupId}-${option.id}`;

  return (
    <FieldLabel htmlFor={inputId} className="inline-flex w-auto">
      <Field orientation="horizontal" className={CHOICE_CHIP_CLASS}>
        <RadioGroupItem value={option.id} id={inputId} />
        <FieldTitle className="text-xs font-normal">{option.label}</FieldTitle>
      </Field>
    </FieldLabel>
  );
}
