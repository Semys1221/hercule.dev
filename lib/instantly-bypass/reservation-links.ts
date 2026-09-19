export const RESERVATION_AGENCE_PLACEHOLDER = "{{reservation_agence_link}}";
export const RESERVATION_ENTREPRISE_PLACEHOLDER = "{{reservation_entreprise_link}}";

export const RESERVATION_CIF_PLACEHOLDER = "{{reservation_cif_link}}";
export const RESERVATION_COMPTABLE_PLACEHOLDER = "{{reservation_comptable_link}}";
export const RESERVATION_JUM_PLACEHOLDER = "{{reservation_jum_link}}";

export function templateRequiresReservationLink(bodyHtml: string): boolean {
  return (
    bodyHtml.includes(RESERVATION_AGENCE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_ENTREPRISE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_CIF_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_COMPTABLE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_JUM_PLACEHOLDER)
  );
}

export function readReservationLink(
  lead?: {
    payload?: Record<string, unknown> | null;
    custom_variables?: Record<string, unknown> | null;
  },
  payload?: Record<string, unknown>,
): string | null {
  const keys = [
    "reservation_agence_link",
    "reservation_entreprise_link",
    "reservation_cif_link",
    "reservation_comptable_link",
    "reservation_jum_link",
  ] as const;

  const sources = [payload, lead?.payload, lead?.custom_variables];
  for (const key of keys) {
    for (const source of sources) {
      const value = source?.[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}
