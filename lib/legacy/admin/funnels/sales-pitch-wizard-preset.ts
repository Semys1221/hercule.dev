import type { SalesQualificationValues } from "@/lib/legacy/admin/funnels/sales-qualification-schema";

export function buildCabinetPitchPresetValues(
  audience: "cif" | "comptable",
): Pick<
  SalesQualificationValues,
  | "p2DecisionMakers"
  | "p2MissingRole"
  | "p3Acknowledged"
  | "pCgvAccepted"
  | "p5BuyIn"
  | "p7FoundationBuyIn"
  | "p7BuyIn"
  | "p9BuyIn"
  | "pRoiAcknowledged"
  | "p11TempCheck"
  | "p11WhyId"
  | "p12Plan"
  | "p12WhyId"
  | "pitchWizardCompleted"
> {
  return {
    p2DecisionMakers: "all_present",
    p2MissingRole: undefined,
    p3Acknowledged: true,
    pCgvAccepted: true,
    p5BuyIn: "clear",
    p7FoundationBuyIn: "clear",
    p7BuyIn: "clear",
    p9BuyIn: "clear",
    pRoiAcknowledged: true,
    p11TempCheck: "yes",
    p11WhyId: "zone_lock",
    p12Plan: "horizon",
    p12WhyId: "guarantee_20_rdv",
    pitchWizardCompleted: true,
  };
}
