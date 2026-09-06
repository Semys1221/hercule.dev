import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { DashboardFormData } from "@/lib/dashboard/types";

/**
 * Q2 option ID → human label lookup.
 * Kept inline to avoid importing the full SALES_QUESTIONS array at runtime
 * (it pulls in slider configs and formatters not needed here).
 */
const Q2_LABELS: Record<string, string> = {
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

/**
 * Maps sales qualification answers to the subset of DashboardFormData
 * that can be inferred from the qualification.
 *
 * Rules (per plan):
 *  q2  → specialites  (resolve option IDs to human labels; skip "other" marker)
 *  q20 → capacite     (direct — Hercule reserved capacity)
 *  q13 → budgetMinPonctuel (null → undefined)
 *  q14.months3 → budgetMinMensuel (0 → undefined)
 *
 * `zone` is intentionally excluded — it is not captured in the qualification.
 */
export function mapQualificationToForm(
  q: Partial<SalesQualificationValues>,
): Partial<DashboardFormData> {
  const result: Partial<DashboardFormData> = {};

  // specialites: resolve q2 option IDs to labels, ignore "other" marker itself
  if (Array.isArray(q.q2) && q.q2.length > 0) {
    const resolved = q.q2
      .filter((id) => id !== "other")
      .map((id) => Q2_LABELS[id] ?? id);

    // If "other" was selected and q2Other is set, append the free-text value
    if (q.q2.includes("other") && q.q2Other?.trim()) {
      resolved.push(q.q2Other.trim());
    }

    if (resolved.length > 0) {
      result.specialites = resolved;
    }
  }

  // capacite: Hercule reserved capacity (q20)
  if (typeof q.q20 === "number" && q.q20 > 0) {
    result.capacite = q.q20;
  }

  // budgetMinPonctuel: one-time minimum (q13)
  if (typeof q.q13 === "number" && q.q13 > 0) {
    result.budgetMinPonctuel = q.q13;
  }

  // budgetMinMensuel: retainer minimum (q14.months3)
  if (typeof q.q14?.months3 === "number" && q.q14.months3 > 0) {
    result.budgetMinMensuel = q.q14.months3;
  }

  return result;
}
