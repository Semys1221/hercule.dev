"use client";

import type { LucideIcon } from "lucide-react";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UseFormReturn } from "react-hook-form";

import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import { SalesSingleChoiceField } from "../sales-question-fields";
import { pitchSingleQuestion } from "./pitch-utils";
import { PITCH_BUYIN_OPTIONS } from "../sales-pitch-wizard-slides";

type MetricTileProps = {
  icon: LucideIcon;
  value: string;
  label: string;
  tone?: "default" | "primary" | "muted";
  compact?: boolean;
  className?: string;
};

export function MetricTile({
  icon: Icon,
  value,
  label,
  tone = "default",
  compact = false,
  className,
}: MetricTileProps) {
  const toneClass =
    tone === "primary"
      ? "border-primary/30 bg-primary/10"
      : tone === "muted"
        ? "border-border bg-muted/40"
        : "border-border bg-card";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4",
        toneClass,
        compact && "p-3",
        className,
      )}
    >
      <Icon className={cn("text-primary", compact ? "size-4" : "size-5")} aria-hidden />
      <p className={cn("font-medium tracking-tight", compact ? "text-lg" : "text-2xl")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

type FlowNodeProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  className?: string;
};

export function FlowNode({ icon: Icon, title, subtitle, className }: FlowNodeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {subtitle ? <p className="max-w-[10rem] text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

type VersusRowProps = {
  criterion: string;
  loser: string;
  winner: string;
};

export function VersusRow({ criterion, loser, winner }: VersusRowProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xs text-muted-foreground line-through">{loser}</p>
      <p className="text-center text-xs font-medium">{criterion}</p>
      <p className="flex items-center justify-end gap-1.5 text-right text-xs font-medium text-primary">
        <Check className="size-3.5 shrink-0" aria-hidden />
        <span>{winner}</span>
      </p>
    </div>
  );
}

type ZoneScarcityBadgeProps = {
  department: string;
  className?: string;
};

export function ZoneScarcityBadge({ department, className }: ZoneScarcityBadgeProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/40 text-primary">
          1 licence · {department}
        </Badge>
        <Badge variant="secondary">Attribution en cours</Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Disponibilité zone</span>
          <span className="font-medium text-foreground">1 / 1</span>
        </div>
        <Progress value={92} className="h-2" />
      </div>
    </div>
  );
}

type PitchBuyInTilesProps = {
  form: UseFormReturn<SalesQualificationValues>;
  fieldName: "p5BuyIn" | "p7FoundationBuyIn" | "p7BuyIn" | "p9BuyIn";
  buyInPrompt?: string;
};

export function PitchBuyInTiles({
  form,
  fieldName,
  buyInPrompt = "Ça fait sens ?",
}: PitchBuyInTilesProps) {
  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem>
          <p className="text-sm font-medium">{buyInPrompt}</p>
          <RadioGroup
            value={field.value ?? ""}
            onValueChange={field.onChange}
            className="grid gap-3 sm:grid-cols-2"
          >
            {PITCH_BUYIN_OPTIONS.map((option) => {
              const inputId = `${fieldName}-${option.id}`;
              const isSelected = field.value === option.id;
              return (
                <FieldLabel
                  key={option.id}
                  htmlFor={inputId}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <RadioGroupItem value={option.id} id={inputId} />
                  <span className="text-sm font-medium">{option.label}</span>
                </FieldLabel>
              );
            })}
          </RadioGroup>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

type ChoiceTilesProps = {
  prompt: string;
  value: string;
  options: ReadonlyArray<{ id: string; label: string; icon?: LucideIcon }>;
  onChange: (value: string) => void;
  name: string;
};

export function ChoiceTiles({ prompt, value, options, onChange, name }: ChoiceTilesProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{prompt}</p>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option) => {
          const inputId = `${name}-${option.id}`;
          const Icon = option.icon;
          const isSelected = value === option.id;
          return (
            <FieldLabel
              key={option.id}
              htmlFor={inputId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <RadioGroupItem value={option.id} id={inputId} />
              {Icon ? <Icon className="size-5 text-primary" aria-hidden /> : null}
              <span className="text-sm font-medium">{option.label}</span>
            </FieldLabel>
          );
        })}
      </RadioGroup>
    </div>
  );
}

type IconChipGridProps = {
  items: ReadonlyArray<{ icon: LucideIcon; label: string }>;
  tone?: "destructive" | "primary";
};

export function IconChipGrid({ items, tone = "primary" }: IconChipGridProps) {
  const toneClass =
    tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item.label} variant="outline" className={cn("gap-1.5 px-3 py-1.5", toneClass)}>
          <item.icon className="size-3.5" aria-hidden />
          {item.label}
        </Badge>
      ))}
    </div>
  );
}

type MilestoneStripProps = {
  milestones: ReadonlyArray<{ label: string; detail?: string }>;
};

export function MilestoneStrip({ milestones }: MilestoneStripProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {milestones.map((milestone, index) => (
        <div
          key={milestone.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Étape {index + 1}
          </p>
          <p className="text-sm font-medium">{milestone.label}</p>
          {milestone.detail ? (
            <p className="text-xs text-muted-foreground">{milestone.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type DualClockProps = {
  leftLabel: string;
  leftValue: number;
  leftMax: number;
  rightLabel: string;
  rightValue: number;
  rightMax: number;
};

export function DualClock({
  leftLabel,
  leftValue,
  leftMax,
  rightLabel,
  rightValue,
  rightMax,
}: DualClockProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { label: leftLabel, value: leftValue, max: leftMax },
        { label: rightLabel, value: rightValue, max: rightMax },
      ].map((clock) => (
        <div
          key={clock.label}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4"
        >
          <div className="relative flex size-20 items-center justify-center rounded-full border-4 border-primary/20">
            <span className="text-lg font-medium">{clock.value}j</span>
          </div>
          <Progress value={(clock.value / clock.max) * 100} className="h-1.5 w-full" />
          <p className="text-xs font-medium text-muted-foreground">{clock.label}</p>
        </div>
      ))}
    </div>
  );
}

type RaciSplitProps = {
  rows: ReadonlyArray<{
    role: string;
    hercule: string;
    cabinet: string;
  }>;
};

export function RaciSplit({ rows }: RaciSplitProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
        <span>Rôle</span>
        <span className="text-center text-primary">Hercule</span>
        <span className="text-center">Cabinet</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.role}
          className="grid grid-cols-3 items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs"
        >
          <span className="font-medium">{row.role}</span>
          <span className="text-center text-muted-foreground">
            {row.hercule === "—" ? <X className="mx-auto size-3.5 opacity-40" /> : row.hercule}
          </span>
          <span className="text-center text-muted-foreground">
            {row.cabinet === "—" ? <X className="mx-auto size-3.5 opacity-40" /> : row.cabinet}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PitchRoiMetricStrip({
  investment,
  guarantee,
  yearOne,
  compact = false,
}: {
  investment: string;
  guarantee: string;
  yearOne: string;
  compact?: boolean;
}) {
  const tiles = [
    { label: "Invest. 90 j", value: investment },
    { label: "Garantie", value: guarantee },
    { label: "Année 1", value: yearOne },
  ];

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "sm:grid-cols-3")}>
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={cn(
            "flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30",
            compact ? "p-2" : "p-3",
          )}
        >
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{tile.label}</p>
          <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>{tile.value}</p>
        </div>
      ))}
    </div>
  );
}

export function PitchBuyInSlide({
  form,
  fieldName,
  content,
  buyInPrompt,
}: {
  form: UseFormReturn<SalesQualificationValues>;
  fieldName: PitchBuyInTilesProps["fieldName"];
  content: ReactNode;
  buyInPrompt?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {content}
      <PitchBuyInTiles form={form} fieldName={fieldName} buyInPrompt={buyInPrompt} />
    </div>
  );
}
