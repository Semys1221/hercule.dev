"use client";

import { CircleHelp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  O3_DURATION_OPTIONS,
  type O3DurationId,
} from "@/lib/legacy/admin/funnels/sales-bleed-track";
import { SALES_SKIP_VALUE } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import {
  formatSliderLabel,
  formatSliderRange,
  type SalesAcknowledgmentQuestion,
  type SalesConditionalSliderQuestion,
  type SalesConfirmationMirrorQuestion,
  type SalesDiagnosticCardQuestion,
  type SalesTextQuestion,
  type SalesMultiQuestion,
  type SalesQuestionOption,
  type SalesSingleQuestion,
  type SalesSliderConfig,
  type SalesSliderMatrixQuestion,
  type SalesSliderQuestion,
} from "./sales-questions";

/**
 * Spacing model (single source of truth):
 *   prompt → description : gap-2  (8px, inside SalesQuestionHeader)
 *   header  → answers    : gap-4  (16px, FieldSet gap)
 *
 * Override the shadcn FieldSet conditional gap-3 on checkbox/radio so all
 * question types share the same 16px vertical rhythm.
 */
const QUESTION_FIELD_SET =
  "gap-4 has-[>[data-slot=checkbox-group]]:gap-4 has-[>[data-slot=radio-group]]:gap-4";
const SLIDER_VALUE_GAP = "space-y-3";
const CHOICE_GROUP_CLASS =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,9.5rem),1fr))] gap-2";
const IMMERSIVE_CHOICE_GROUP_CLASS =
  "grid grid-cols-1 gap-3 sm:grid-cols-2";
/** FieldLabel adds border/background when wrapping a Field — layout only on the inner Field. */
const CHOICE_LABEL_CLASS =
  "w-full font-normal transition-colors hover:border-primary/50 hover:bg-primary/5";
const IMMERSIVE_CHOICE_LABEL_CLASS =
  "w-full font-normal transition-colors hover:border-primary/50 hover:bg-primary/5 rounded-lg border border-border bg-card/40";
const CHOICE_LABEL_DISABLED_CLASS =
  "cursor-not-allowed opacity-50 hover:border-border hover:bg-transparent";
const CHOICE_FIELD_CLASS = "min-h-10 flex-1 items-center gap-2 !p-3";
const IMMERSIVE_CHOICE_FIELD_CLASS = "min-h-14 flex-1 items-center gap-3 !p-4";
const CHOICE_CHIP_WRAPPER_CLASS = "relative flex w-full items-stretch";

export type SalesQuestionFieldVariant = "default" | "immersive";

function OptionHelpPopover({ option }: { option: SalesQuestionOption }) {
  if (!option.helpText) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 z-10 size-6 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Aide : ${option.helpTitle ?? option.label}`}
          onClick={(event) => event.stopPropagation()}
        >
          <CircleHelp className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 text-sm"
        onClick={(event) => event.stopPropagation()}
      >
        {option.helpTitle ? (
          <p className="mb-1 font-medium leading-snug">{option.helpTitle}</p>
        ) : null}
        <p className="text-muted-foreground">{option.helpText}</p>
      </PopoverContent>
    </Popover>
  );
}

function QuestionNumber({ number }: { number: number }) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">Q{number}.</span>
  );
}

function QuestionLegend({ number, prompt }: { number: number; prompt: string }) {
  return (
    <span className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-2">
      <QuestionNumber number={number} />
      <span>{prompt}</span>
    </span>
  );
}

/**
 * Unified question header: prompt + optional trailing element (e.g. counter badge)
 * + optional description subtitle.
 *
 * Uses a plain <p> instead of FieldDescription to avoid the shadcn
 * `[[data-variant=legend]+&]:-mt-1.5` negative margin that depends on DOM adjacency
 * and varies between field types.
 */
function SalesQuestionHeader({
  number,
  prompt,
  description,
  bleedBenefit,
  trailing,
}: {
  number: number;
  prompt: string;
  description?: string;
  bleedBenefit?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FieldLegend className="mb-0 text-[15px] font-medium leading-snug">
          <QuestionLegend number={number} prompt={prompt} />
        </FieldLegend>
        {trailing}
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {bleedBenefit ? (
        <p className="text-xs text-muted-foreground">{bleedBenefit}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single-choice (radio)
// ---------------------------------------------------------------------------

type SalesSingleChoiceFieldProps = {
  question: SalesSingleQuestion;
  value: string;
  onChange: (value: string) => void;
  variant?: SalesQuestionFieldVariant;
};

export function SalesSingleChoiceField({
  question,
  value,
  onChange,
  variant = "default",
}: SalesSingleChoiceFieldProps) {
  const immersive = variant === "immersive";

  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      {!immersive ? (
        <SalesQuestionHeader
          number={question.number}
          prompt={question.prompt}
          description={question.description}
          bleedBenefit={question.bleedBenefit}
        />
      ) : null}
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className={immersive ? IMMERSIVE_CHOICE_GROUP_CLASS : CHOICE_GROUP_CLASS}
      >
        {question.options.map((option) => (
          <ChoiceChip
            key={option.id}
            option={option}
            groupId={question.id}
            variant={variant}
          />
        ))}
      </RadioGroup>
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Multi-choice (checkbox)
// ---------------------------------------------------------------------------

type SalesMultiChoiceFieldProps = {
  question: SalesMultiQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  variant?: SalesQuestionFieldVariant;
};

export function SalesMultiChoiceField({
  question,
  value,
  onChange,
  otherValue = "",
  onOtherChange,
  variant = "default",
}: SalesMultiChoiceFieldProps) {
  const immersive = variant === "immersive";
  const maxSelections = question.maxSelections;
  const exclusiveId = question.exclusiveOptionId;
  const disabledOptionIds = new Set(
    question.options.filter((option) => option.disabled).map((option) => option.id),
  );
  const selectableValue = value.filter((id) => !disabledOptionIds.has(id));
  const atLimit = selectableValue.length >= maxSelections;

  function toggleOption(optionId: string, checked: boolean, optionDisabled: boolean) {
    if (optionDisabled) {
      return;
    }

    if (checked) {
      if (exclusiveId && optionId === exclusiveId) {
        onChange([optionId]);
        return;
      }

      if (exclusiveId && selectableValue.includes(exclusiveId)) {
        onChange([optionId]);
        return;
      }

      if (selectableValue.length >= maxSelections) {
        return;
      }

      onChange([...selectableValue, optionId]);
      return;
    }

    onChange(selectableValue.filter((id) => id !== optionId));
  }

  const counterBadge = question.description ? (
    <Badge variant="outline" className="h-5 px-1.5 text-xs font-normal">
      {selectableValue.length}/{maxSelections}
    </Badge>
  ) : null;

  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      {!immersive ? (
        <SalesQuestionHeader
          number={question.number}
          prompt={question.prompt}
          description={question.description}
          bleedBenefit={question.bleedBenefit}
          trailing={counterBadge}
        />
      ) : null}
      <FieldGroup
        data-slot="checkbox-group"
        className={immersive ? IMMERSIVE_CHOICE_GROUP_CLASS : CHOICE_GROUP_CLASS}
      >
        {question.options.map((option) => {
          const isChecked = selectableValue.includes(option.id);
          const optionDisabled = Boolean(option.disabled);
          const isDisabled = optionDisabled || (!isChecked && atLimit);
          const inputId = `${question.id}-${option.id}`;

          return (
            <div key={option.id} className={CHOICE_CHIP_WRAPPER_CLASS}>
              <FieldLabel
                htmlFor={inputId}
                className={cn(
                  CHOICE_LABEL_CLASS,
                  isDisabled && CHOICE_LABEL_DISABLED_CLASS,
                )}
              >
                <Field orientation="horizontal" className={CHOICE_FIELD_CLASS}>
                  <Checkbox
                    id={inputId}
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={(checked) =>
                      toggleOption(option.id, checked === true, optionDisabled)
                    }
                  />
                  <span className="pr-6 text-sm">{option.label}</span>
                </Field>
              </FieldLabel>
              <OptionHelpPopover option={option} />
            </div>
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

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

type SalesSliderFieldProps = {
  question: SalesSliderQuestion;
  value: number | null;
  onChange: (value: number | null) => void;
  sliderConfig?: SalesSliderConfig;
  alertMessage?: string;
  variant?: SalesQuestionFieldVariant;
};

export function SalesSliderField({
  question,
  value,
  onChange,
  sliderConfig,
  alertMessage,
  variant = "default",
}: SalesSliderFieldProps) {
  const immersive = variant === "immersive";
  const { slider, optOutLabel } = question;
  const config = sliderConfig ?? slider;
  const optedOut = value === null;
  const displayValue = optedOut ? config.defaultValue : value;

  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      {!immersive ? (
        <SalesQuestionHeader
          number={question.number}
          prompt={question.prompt}
          description={question.description}
          bleedBenefit={question.bleedBenefit}
        />
      ) : null}
      <SliderControl
        config={config}
        value={displayValue}
        disabled={optedOut}
        onChange={(next) => onChange(next)}
      />
      {alertMessage ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">{alertMessage}</p>
      ) : null}
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

// ---------------------------------------------------------------------------
// Slider matrix
// ---------------------------------------------------------------------------

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
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader
        number={question.number}
        prompt={question.prompt}
        description={question.description}
        bleedBenefit={question.bleedBenefit}
      />
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

// ---------------------------------------------------------------------------
// Conditional slider
// ---------------------------------------------------------------------------

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
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader
        number={question.number}
        prompt={question.prompt}
        description={question.description}
        bleedBenefit={question.bleedBenefit}
      />
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

// ---------------------------------------------------------------------------
// Acknowledgment trap (b6)
// ---------------------------------------------------------------------------

type SalesAcknowledgmentFieldProps = {
  question: SalesAcknowledgmentQuestion;
  trapText: string;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
};

export function SalesAcknowledgmentField({
  question,
  trapText,
  acknowledged,
  onAcknowledgedChange,
}: SalesAcknowledgmentFieldProps) {
  const paragraphs = trapText.split("\n").filter((line) => line.length > 0);

  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader number={question.number} prompt={question.prompt} />
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p
            key={`${question.id}-paragraph-${index}-${paragraph.slice(0, 24)}`}
            className={index > 0 ? "mt-3 font-medium" : undefined}
          >
            {paragraph.replace(/\*\*(.*?)\*\*/g, "$1")}
          </p>
        ))}
      </div>
      <Field orientation="horizontal">
        <Checkbox
          id={`${question.id}-ack`}
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
        />
        <FieldLabel htmlFor={`${question.id}-ack`} className="text-sm font-normal">
          {question.checkboxLabel ?? "Le cabinet reconnaît ce constat"}
        </FieldLabel>
      </Field>
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Text (wizard follow-ups)
// ---------------------------------------------------------------------------

type SalesTextFieldProps = {
  question: SalesTextQuestion;
  value: string;
  onChange: (value: string) => void;
};

export function SalesTextField({ question, value, onChange }: SalesTextFieldProps) {
  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader
        number={question.number}
        prompt={question.prompt}
        description={question.description}
      />
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder ?? "Réponse du cabinet…"}
        rows={3}
      />
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Confirmation mirror (wizard w12)
// ---------------------------------------------------------------------------

type SalesConfirmationMirrorFieldProps = {
  question: SalesConfirmationMirrorQuestion;
  mirrorText: string;
  confirmed: boolean;
  onConfirmedChange: (value: boolean) => void;
};

export function SalesConfirmationMirrorField({
  question,
  mirrorText,
  confirmed,
  onConfirmedChange,
}: SalesConfirmationMirrorFieldProps) {
  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader number={question.number} prompt={question.prompt} />
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm font-medium leading-relaxed">
        {mirrorText.replace(/\*\*(.*?)\*\*/g, "$1")}
      </div>
      <Field orientation="horizontal">
        <Checkbox
          id={`${question.id}-confirm`}
          checked={confirmed}
          onCheckedChange={(checked) => onConfirmedChange(checked === true)}
        />
        <FieldLabel htmlFor={`${question.id}-confirm`} className="text-sm font-normal">
          {question.checkboxLabel}
        </FieldLabel>
      </Field>
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Diagnostic card
// ---------------------------------------------------------------------------

type SalesDiagnosticCardFieldProps = {
  question: SalesDiagnosticCardQuestion;
  mirrorText: string;
  accepted: boolean;
  onAcceptedChange: (value: boolean) => void;
};

export function SalesDiagnosticCardField({
  question,
  mirrorText,
  accepted,
  onAcceptedChange,
}: SalesDiagnosticCardFieldProps) {
  return (
    <FieldSet className={QUESTION_FIELD_SET}>
      <SalesQuestionHeader number={question.number} prompt={question.prompt} />
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed">
        {mirrorText.replace(/\*\*(.*?)\*\*/g, "$1")}
      </div>
      <Field orientation="horizontal">
        <Checkbox
          id={`${question.id}-accept`}
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
        />
        <FieldLabel htmlFor={`${question.id}-accept`} className="text-sm font-normal">
          {question.checkboxLabel}
        </FieldLabel>
      </Field>
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Coach cue
// ---------------------------------------------------------------------------

export function SalesCoachCue({ cue }: { cue: string }) {
  return (
    <p className="mt-3 text-sm italic text-muted-foreground">{cue}</p>
  );
}

// ---------------------------------------------------------------------------
// O3 duration chips (agence / entreprise)
// ---------------------------------------------------------------------------

type SalesO3DurationChipsFieldProps = {
  value?: O3DurationId;
  onChange: (value: O3DurationId) => void;
};

export function SalesO3DurationChipsField({
  value,
  onChange,
}: SalesO3DurationChipsFieldProps) {
  return (
    <FieldSet className="mt-4 gap-3">
      <FieldLegend className="mb-0 text-sm font-medium leading-snug">
        Depuis combien de temps cet écart pèse sur le portefeuille ?
      </FieldLegend>
      <div className={CHOICE_GROUP_CLASS}>
        {O3_DURATION_OPTIONS.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant={value === option.id ? "default" : "outline"}
            size="sm"
            className="h-auto min-h-10 whitespace-normal px-3 py-2 text-left text-xs"
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </FieldSet>
  );
}

// ---------------------------------------------------------------------------
// Internal primitives
// ---------------------------------------------------------------------------

type SliderControlProps = {
  config: SalesSliderConfig;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

function SliderControl({ config, value, disabled = false, onChange }: SliderControlProps) {
  return (
    <div className={SLIDER_VALUE_GAP}>
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
  variant?: SalesQuestionFieldVariant;
};

function ChoiceChip({ option, groupId, variant = "default" }: ChoiceChipProps) {
  const immersive = variant === "immersive";
  const inputId = `${groupId}-${option.id}`;
  const optionDisabled = Boolean(option.disabled);

  return (
    <div className={CHOICE_CHIP_WRAPPER_CLASS}>
      <FieldLabel
        htmlFor={inputId}
        className={cn(
          immersive ? IMMERSIVE_CHOICE_LABEL_CLASS : CHOICE_LABEL_CLASS,
          optionDisabled && CHOICE_LABEL_DISABLED_CLASS,
        )}
      >
        <Field
          orientation="horizontal"
          className={immersive ? IMMERSIVE_CHOICE_FIELD_CLASS : CHOICE_FIELD_CLASS}
        >
          <RadioGroupItem value={option.id} id={inputId} disabled={optionDisabled} />
          <FieldTitle className={cn("pr-6 font-normal", immersive ? "text-base" : "text-sm")}>
            {option.label}
          </FieldTitle>
        </Field>
      </FieldLabel>
      <OptionHelpPopover option={option} />
    </div>
  );
}
