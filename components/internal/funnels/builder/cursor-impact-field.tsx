"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { CursorImpact } from "@/lib/admin/funnels/schema";

const IMPACT_OPTIONS: Array<{ value: CursorImpact; label: string; hint: string }> = [
  {
    value: "light",
    label: "Light",
    hint: "Corrige l'orthographe sans modifier le sens.",
  },
  {
    value: "medium",
    label: "Medium",
    hint: "Ton professionnel aligné avec le site (défaut).",
  },
  {
    value: "high",
    label: "High",
    hint: "Réécriture créative à partir d'un brief vague.",
  },
];

type CursorImpactFieldProps = {
  value: CursorImpact;
  onChange: (value: CursorImpact) => void;
};

export function CursorImpactField({ value, onChange }: CursorImpactFieldProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as CursorImpact)}
      className="grid gap-3"
    >
      {IMPACT_OPTIONS.map((option) => (
        <div key={option.value} className="flex items-start gap-3 rounded-lg border p-3">
          <RadioGroupItem value={option.value} id={`impact-${option.value}`} className="mt-1" />
          <div className="space-y-1">
            <Label htmlFor={`impact-${option.value}`} className="font-medium">
              {option.label}
            </Label>
            <p className="text-xs text-muted-foreground">{option.hint}</p>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
