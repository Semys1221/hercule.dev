import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { mapQualificationToForm } from "@/lib/admin/onboarding/qualification-mapper";
import type { DashboardFormData } from "@/lib/dashboard/types";

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return value > 0;
  return true;
}

/** True when profile.form has no meaningful onboarding fields yet. */
export function isFormSparse(form: DashboardFormData): boolean {
  return (
    !hasValue(form.specialites) &&
    !hasValue(form.zone) &&
    !hasValue(form.capacite) &&
    !hasValue(form.budgetMinPonctuel) &&
    !hasValue(form.budgetMinMensuel)
  );
}

/**
 * Merge profile.form with qualification-derived fields.
 * Existing profile values win; qualification fills gaps only.
 */
export function resolvePreviewForm(
  profileForm: DashboardFormData,
  qualification?: Partial<SalesQualificationValues>,
): DashboardFormData {
  const fromQualification = qualification ? mapQualificationToForm(qualification) : {};

  return {
    specialites: hasValue(profileForm.specialites)
      ? profileForm.specialites
      : fromQualification.specialites,
    zone: hasValue(profileForm.zone) ? profileForm.zone : fromQualification.zone,
    capacite: hasValue(profileForm.capacite)
      ? profileForm.capacite
      : fromQualification.capacite,
    budgetMinPonctuel: hasValue(profileForm.budgetMinPonctuel)
      ? profileForm.budgetMinPonctuel
      : fromQualification.budgetMinPonctuel,
    budgetMinMensuel: hasValue(profileForm.budgetMinMensuel)
      ? profileForm.budgetMinMensuel
      : fromQualification.budgetMinMensuel,
  };
}
