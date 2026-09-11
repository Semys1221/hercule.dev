import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { DashboardFormData } from "@/lib/dashboard/types";

/**
 * Q2 option ID → human label lookup (comptable session).
 */
const Q2_LABELS_COMPTABLE: Record<string, string> = {
  paid_acquisition: "Fiscalité des entreprises",
  organic_seo: "Social / paie",
  design_ux: "Juridique des sociétés",
  frontend: "Tenue comptable TPE",
  backend: "Tenue comptable PME",
  ecommerce: "E-commerce / activités digitales",
  automation: "Outils digitaux / intégrations",
  branding: "Transmission / cession",
  consulting: "Conseil en gestion",
  other: "Autre",
};

/**
 * Q2 option ID → human label lookup (agence session).
 */
const Q2_LABELS_AGENCE: Record<string, string> = {
  paid_acquisition: "Acquisition payante",
  organic_seo: "Acquisition organique / SEO",
  design_ux: "Design / UX-UI",
  frontend: "Développement Front-End",
  backend: "Développement Back-End",
  ecommerce: "E-commerce",
  automation: "Automatisation / intégration",
  branding: "Branding / identité",
  consulting: "Conseil / stratégie",
  other: "Autre",
};

const Q14_FACTURATION_LABELS: Record<string, string> = {
  monthly_12: "Mensualisé (12 acomptes)",
  quarterly: "Trimestriel",
  annual: "Annuel",
  variable: "Selon le dossier",
};

const Q15_SOCIAL_LABELS: Record<string, string> = {
  included: "Inclus dans la lettre de mission",
  separate: "Facturé à part (forfait annuel)",
  not_offered: "Non proposé",
};

/**
 * Maps sales qualification answers to dashboard profile fields.
 *
 * Comptable:
 *  q2  → specialites
 *  q13 → honorairesAnnuelsMin
 *  q14 → facturationMode
 *  q15 → socialPaieMode
 *  q16 → honorairesPonctuelMin (null → undefined)
 *  q20 → capacite
 */
export function mapQualificationToForm(
  q: Partial<SalesQualificationValues>,
  audience: "agence" | "comptable" | "entreprise" | "cif" = "agence",
): Partial<DashboardFormData> {
  const result: Partial<DashboardFormData> = {};
  const q2Labels =
    audience === "comptable" || audience === "cif" ? Q2_LABELS_COMPTABLE : Q2_LABELS_AGENCE;

  if (Array.isArray(q.q2) && q.q2.length > 0) {
    const resolved = q.q2
      .filter((id) => id !== "other")
      .map((id) => q2Labels[id] ?? id);

    if (q.q2.includes("other") && q.q2Other?.trim()) {
      resolved.push(q.q2Other.trim());
    }

    if (resolved.length > 0) {
      result.specialites = resolved;
    }
  }

  if (typeof q.q20 === "number" && q.q20 > 0) {
    result.capacite = q.q20;
  }

  if (audience === "comptable" || audience === "cif") {
    if (typeof q.q13 === "number" && q.q13 > 0) {
      result.honorairesAnnuelsMin = q.q13;
    }

    if (typeof q.q14 === "string" && q.q14 in Q14_FACTURATION_LABELS) {
      result.facturationMode = q.q14;
    }

    if (typeof q.q15 === "string" && q.q15 in Q15_SOCIAL_LABELS) {
      result.socialPaieMode = q.q15;
    }

    if (typeof q.q16 === "number" && q.q16 > 0) {
      result.honorairesPonctuelMin = q.q16;
    }

    return result;
  }

  if (typeof q.q13 === "number" && q.q13 > 0) {
    result.budgetMinPonctuel = q.q13;
  }

  if (
    typeof q.q14 === "object" &&
    q.q14 !== null &&
    typeof q.q14.months3 === "number" &&
    q.q14.months3 > 0
  ) {
    result.budgetMinMensuel = q.q14.months3;
  }

  return result;
}
