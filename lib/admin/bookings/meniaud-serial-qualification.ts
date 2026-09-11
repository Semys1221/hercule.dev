import { getSalesQualificationDefaultValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

/** Serial preset fallback when Nahmias notes are unavailable (Meniaud). */
export function buildMeniaudSerialQualification(): SalesQualificationValues {
  const defaults = getSalesQualificationDefaultValues("comptable");

  return {
    ...defaults,
    introConfirmed: true,
    presentationConfirmed: true,
    q3: 6,
    q4: "high",
    q10: "all",
    q13: 2800,
    q14: "monthly_12",
    q15: "included",
    q16: null,
    q20: 4,
  };
}
