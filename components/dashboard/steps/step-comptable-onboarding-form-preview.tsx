"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { CGV_VERSION } from "../onboarding-form-fields";
import { RetractionWaiverFields } from "../retraction-waiver-fields";

export function StepComptableOnboardingFormPreview() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Onboarding cabinet — aperçu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce formulaire sera disponible après paiement pour confirmer votre accès et vos
          préférences de rétractation.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-dashed border-border bg-muted/20 p-6">
        <div className="flex items-start gap-3 opacity-60">
          <Checkbox id="preview-comptable-cgv" checked={false} disabled />
          <Label htmlFor="preview-comptable-cgv" className="text-sm leading-snug font-normal">
            CGV Hercule Comptable (version du {CGV_VERSION})
          </Label>
        </div>

        <div className="opacity-60">
          <RetractionWaiverFields
            idPrefix="preview-comptable"
            cvgHref="/cvg/comptable"
            checked={false}
            onCheckedChange={() => undefined}
            disabled
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Disponible après activation du paiement
        </p>
      </div>
    </div>
  );
}
