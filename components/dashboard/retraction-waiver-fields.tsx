"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { COMMERCIAL } from "@/lib/commercial/constants";

type RetractionWaiverFieldsProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  idPrefix?: string;
  disabled?: boolean;
};

export function RetractionWaiverFields({
  checked,
  onCheckedChange,
  idPrefix = "rw",
  disabled = false,
}: RetractionWaiverFieldsProps) {
  const fieldId = `${idPrefix}-waive-retraction`;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
        />
        <Label htmlFor={fieldId} className="cursor-pointer text-sm leading-snug font-normal">
          Je renonce à mon délai de rétractation de {COMMERCIAL.retractationDays} jours pour
          lancer la recherche maintenant.{" "}
          <a
            href="/cvg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Voir les CGV §8
          </a>
        </Label>
      </div>
    </div>
  );
}
