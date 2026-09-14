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
  | "w8Tried"
  | "w8TriedWho"
  | "w8Criteria"
  | "w8Brake"
  | "w9Acknowledged"
  | "w10"
  | "w10Year"
  | "w11"
  | "w12Confirmed"
  | "w13"
  | "w13Why"
  | "w14"
  | "w15"
  | "w16"
  | "w16Detail"
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
    w8Tried: "looked",
    w8TriedWho: isCif
      ? "Réseau notaires local, annuaire apporteurs"
      : "Agence SEO locale, fichier apporteurs",
    w8Criteria: ["predictable_flow", "zone_typology", "honoraires_fit"],
    w8Brake: isCif ? "part_zone" : "wom_scale",
    w9Acknowledged: true,
    w10: isCif ? "y2017" : "y2020",
    w10Year: isCif ? 2017 : 2020,
    w11: "1-3y",
    w12Confirmed: true,
    w13: "no",
    w13Why: isCif
      ? "Les partenariats ne génèrent pas assez de flux qualifié sur la zone."
      : "Le bouche-à-oreille ne scale pas pour atteindre la cible volume.",
    w14: "24m",
    w15: "shortcut",
    w16: "strategic",
    w16Detail: "",
    w18: "significant_gap",
    w17Acknowledged: true,
    bleedDiagnosticAccepted: true,
  };
}
