import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

export function buildCabinetWizardPresetValues(
  audience: "cif" | "comptable",
): Pick<
  SalesQualificationValues,
  | "w1"
  | "w2"
  | "w3"
  | "w4"
  | "w5"
  | "w6"
  | "w7"
  | "w8"
  | "w10"
  | "w10Year"
  | "w12Confirmed"
  | "w13"
  | "w13Why"
  | "w14"
  | "w15"
  | "w16"
  | "w16StrategicSub"
  | "w16ResaleSub"
  | "w16Detail"
  | "wExchangeWhy13"
  | "wExchangeWhy14"
  | "wExchangeWhy15"
  | "wExchangeWhy18"
  | "w18"
  | "w17Acknowledged"
  | "bleedDiagnosticAccepted"
> {
  const isCif = audience === "cif";

  return {
    w1: "more_volume",
    w2: isCif ? 75 : 90,
    w3: isCif ? 15_000_000 : 400_000,
    w4: 2,
    w5: isCif ? 25_000_000 : 600_000,
    w6: 5,
    w7: isCif ? 110 : 130,
    w8: isCif ? "partnerships" : "word_of_mouth",
    w10: isCif ? "y2017" : "y2020",
    w10Year: isCif ? 2017 : 2020,
    w12Confirmed: true,
    w13: "no",
    w13Why: isCif ? "part_inactive" : "wom_scale",
    w14: "24m",
    w15: "shortcut",
    w16: "strategic",
    w16StrategicSub: "growth",
    w16ResaleSub: undefined,
    w16Detail: "",
    wExchangeWhy13: undefined,
    wExchangeWhy14: undefined,
    wExchangeWhy15: undefined,
    wExchangeWhy18: undefined,
    w18: "not_acceptable",
    w17Acknowledged: true,
    bleedDiagnosticAccepted: true,
  };
}
