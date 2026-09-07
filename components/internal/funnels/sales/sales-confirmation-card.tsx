"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import { cn } from "@/lib/utils";

type SalesConfirmationCardProps = {
  id: string;
  legend?: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: string;
};

export function SalesConfirmationCard({
  id,
  legend = "Confirmation",
  label,
  description,
  checked,
  onCheckedChange,
  error,
}: SalesConfirmationCardProps) {
  return (
    <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
      <CardContent className="p-6">
        <FieldSet className="gap-5">
          <FieldLegend className="text-sm font-medium">{legend}</FieldLegend>
          <FieldGroup className="gap-3">
            <Field orientation="horizontal" className="items-start">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                className="mt-0.5"
              />
              <FieldContent className="gap-2">
                <FieldLabel htmlFor={id} className="text-sm font-normal leading-snug">
                  {label}
                </FieldLabel>
                <FieldDescription className="text-xs">{description}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
