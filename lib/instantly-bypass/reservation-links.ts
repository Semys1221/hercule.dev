export const RESERVATION_AGENCE_PLACEHOLDER = "{{reservation_agence_link}}";
export const RESERVATION_ENTREPRISE_PLACEHOLDER = "{{reservation_entreprise_link}}";

export function templateRequiresReservationLink(bodyHtml: string): boolean {
  return (
    bodyHtml.includes(RESERVATION_AGENCE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_ENTREPRISE_PLACEHOLDER)
  );
}

export function readReservationLink(
  lead?: { payload?: Record<string, unknown> | null },
  payload?: Record<string, unknown>,
): string | null {
  const keys = ["reservation_agence_link", "reservation_entreprise_link"] as const;

  for (const key of keys) {
    const fromPayload = payload?.[key];
    if (typeof fromPayload === "string" && fromPayload.trim()) {
      return fromPayload.trim();
    }

    const leadPayload = lead?.payload ?? {};
    const fromLead = leadPayload[key];
    if (typeof fromLead === "string" && fromLead.trim()) {
      return fromLead.trim();
    }
  }

  return null;
}
