import { FOUNDATION_ROI_DISPLAY } from "@/lib/legacy/admin/funnels/comptable-sales-copy";
import {
  buildBleedTrack,
  interpolateBleed,
} from "@/lib/legacy/admin/funnels/sales-bleed-track";
import {
  isPitchP11WhyIdValid,
  isPitchP2MissingRoleValid,
} from "@/lib/legacy/admin/funnels/sales-pitch-bleed-copy";
import { formatObjectifsWizardInterpolation } from "@/lib/legacy/admin/funnels/sales-objectifs-wizard";
import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";
import { isCifSalesAudience } from "@/lib/legacy/admin/funnels/sales-audience";
import type { Audience } from "@/lib/legacy/admin/navigation";

export const PITCH_WIZARD_SUBTITLE =
  "Garantie contractuelle, système en trois piliers, ROI et choix d'infrastructure.";

export const PITCH_STEP_IDS = [
  "p0",
  "p2",
  "p3",
  "pGuarantee",
  "pCgv",
  "p4",
  "p5",
  "p7",
  "p9",
  "pRoi",
  "p11",
  "pDashboard",
] as const;

export type PitchWizardStepId = (typeof PITCH_STEP_IDS)[number];

export type PitchWizardPartId = "societe" | "cgv" | "systeme" | "offre";

export const PITCH_PART_LABELS: Record<PitchWizardPartId, string> = {
  societe: "Setup",
  cgv: "Garantie",
  systeme: "Système",
  offre: "Offre",
};

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export type PitchInterpolationContext = {
  prospectFirstName?: string;
  department?: string;
};

export function getPitchStepPart(stepId: PitchWizardStepId): PitchWizardPartId {
  if (stepId === "p0" || stepId === "p2" || stepId === "p3") {
    return "societe";
  }
  if (stepId === "pGuarantee" || stepId === "pCgv") {
    return "cgv";
  }
  if (stepId === "p4" || stepId === "p5" || stepId === "p7" || stepId === "p9") {
    return "systeme";
  }
  return "offre";
}

export function usesPitchWizard(values: SalesQualificationValues): boolean {
  return values.bleedDiagnosticAccepted === true;
}

export function formatHonorairesLabel(
  values: SalesQualificationValues,
  audience: Audience,
): string {
  if (typeof values.q13 === "number" && values.q13 > 0) {
    return `${euroFormatter.format(values.q13)} € / an`;
  }
  if (typeof values.w3 === "number" && values.w3 > 0) {
    const suffix = isCifSalesAudience(audience) ? " d'encours" : " de CA annuel";
    return `${euroFormatter.format(values.w3)} €${suffix}`;
  }
  return "—";
}

export function resolvePitchDepartment(context?: PitchInterpolationContext): string {
  return context?.department?.trim() || "votre zone";
}

export function formatPitchWizardInterpolation(
  template: string,
  values: SalesQualificationValues,
  audience: Audience,
  context?: PitchInterpolationContext,
): string {
  const bleed = buildBleedTrack(values, audience);
  const objectifsInterpolated = formatObjectifsWizardInterpolation(template, values, audience);
  const withBleed = interpolateBleed(objectifsInterpolated, bleed);

  const replacements: Record<string, string> = {
    honoraires: formatHonorairesLabel(values, audience),
    department: resolvePitchDepartment(context),
    yearOneValue: euroFormatter.format(FOUNDATION_ROI_DISPLAY.yearOneValueEur),
    guaranteeRdv: `${FOUNDATION_ROI_DISPLAY.guaranteeRdvCount} RDV B2B`,
  };

  const withTokens = withBleed.replace(/\{(\w+)\}/g, (match, token: string) => {
    return replacements[token] ?? match;
  });

  const firstName = context?.prospectFirstName?.trim() || "le cabinet";
  return withTokens.replace(/\[Prénom\]/g, firstName);
}

export function isPitchStepVisible(
  stepId: PitchWizardStepId,
  values: SalesQualificationValues,
  audience: Audience = "comptable",
  context?: PitchInterpolationContext,
): boolean {
  if (!usesPitchWizard(values)) {
    return false;
  }

  if (stepId === "pDashboard") {
    if (!isPitchP11WhyIdValid(values.p11WhyId, values, audience, context)) {
      return false;
    }
    if (values.p11TempCheck === "hesitant") {
      return false;
    }
  }

  return true;
}

export function getVisiblePitchStepIds(
  values: SalesQualificationValues,
  audience: Audience = "comptable",
  context?: PitchInterpolationContext,
): PitchWizardStepId[] {
  return PITCH_STEP_IDS.filter((stepId) =>
    isPitchStepVisible(stepId, values, audience, context),
  );
}

export function getPitchFormFieldName(
  stepId: PitchWizardStepId,
): keyof SalesQualificationValues | null {
  switch (stepId) {
    case "p2":
      return "p2DecisionMakers";
    case "p3":
      return "p3Acknowledged";
    case "pCgv":
      return "pCgvAccepted";
    case "p5":
      return "p5BuyIn";
    case "p7":
      return "p7BuyIn";
    case "p9":
      return "p9BuyIn";
    case "pRoi":
      return "pRoiAcknowledged";
    case "p11":
      return "p11TempCheck";
    default:
      return null;
  }
}

export function isPitchFieldComplete(
  stepId: PitchWizardStepId,
  values: SalesQualificationValues,
  audience: Audience = "comptable",
  context?: PitchInterpolationContext,
): boolean {
  switch (stepId) {
    case "p0":
    case "pGuarantee":
    case "p4":
      return true;
    case "p2":
      if (!values.p2DecisionMakers) {
        return false;
      }
      if (values.p2DecisionMakers === "missing") {
        return isPitchP2MissingRoleValid(values.p2MissingRole, audience);
      }
      return true;
    case "p3":
      return values.p3Acknowledged === true;
    case "pCgv":
      return values.pCgvAccepted === true;
    case "p5":
      return values.p5BuyIn === "clear";
    case "p7":
      return values.p7FoundationBuyIn === "clear" && values.p7BuyIn === "clear";
    case "p9":
      return values.p9BuyIn === "clear";
    case "pRoi":
      return values.pRoiAcknowledged === true;
    case "p11":
      if (!values.p11TempCheck) {
        return false;
      }
      if (values.p11TempCheck === "hesitant") {
        return true;
      }
      return isPitchP11WhyIdValid(values.p11WhyId, values, audience, context);
    case "pDashboard":
      return true;
    default:
      return false;
  }
}

export function isPitchWizardComplete(
  values: SalesQualificationValues,
  audience: Audience = "comptable",
  context?: PitchInterpolationContext,
): boolean {
  return PITCH_STEP_IDS.every((stepId) =>
    isPitchFieldComplete(stepId, values, audience, context),
  );
}
