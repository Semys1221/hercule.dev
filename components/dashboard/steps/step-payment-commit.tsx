"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getClosingCommitOptions,
  type ClosingCommitLevel,
} from "@/lib/dashboard/onboarding-faq";
import { cn } from "@/lib/utils";

type StepPaymentCommitProps = {
  value: ClosingCommitLevel | null;
  onChange: (level: ClosingCommitLevel) => void;
};

export function StepPaymentCommit({ value, onChange }: StepPaymentCommitProps) {
  const options = getClosingCommitOptions();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-medium">Prêt à activer ?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choisissez l&apos;option qui correspond à votre situation — les deux mènent à
          l&apos;étape de paiement.
        </p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={(next) => onChange(next as ClosingCommitLevel)}
        className="flex flex-col gap-3"
      >
        {options.map((option) => (
          <div
            key={option.level}
            className={cn(
              "flex items-start gap-3 rounded-lg border border-border p-4 transition-colors",
              value === option.level ? "bg-muted/40 ring-1 ring-border" : "bg-card",
            )}
          >
            <RadioGroupItem
              value={option.level}
              id={`commit-${option.level}`}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-1">
              <Label
                htmlFor={`commit-${option.level}`}
                className="cursor-pointer text-sm font-medium leading-snug"
              >
                {option.label}
              </Label>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
