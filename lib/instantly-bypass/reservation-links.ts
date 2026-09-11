export const RESERVATION_AGENCE_PLACEHOLDER = "{{reservation_agence_link}}";
export const RESERVATION_ENTREPRISE_PLACEHOLDER = "{{reservation_entreprise_link}}";

export const RESERVATION_CIF_PLACEHOLDER = "{{reservation_cif_link}}";
export const RESERVATION_COMPTABLE_PLACEHOLDER = "{{reservation_comptable_link}}";

export function templateRequiresReservationLink(bodyHtml: string): boolean {
  const requires =
    bodyHtml.includes(RESERVATION_AGENCE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_ENTREPRISE_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_CIF_PLACEHOLDER) ||
    bodyHtml.includes(RESERVATION_COMPTABLE_PLACEHOLDER);
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "802b69",
    },
    body: JSON.stringify({
      sessionId: "802b69",
      location: "lib/instantly-bypass/reservation-links.ts:templateRequiresReservationLink",
      message: "reservation placeholder detection",
      data: {
        requires,
        hasCif: bodyHtml.includes(RESERVATION_CIF_PLACEHOLDER),
        hasEntreprise: bodyHtml.includes(RESERVATION_ENTREPRISE_PLACEHOLDER),
        hasAgence: bodyHtml.includes(RESERVATION_AGENCE_PLACEHOLDER),
        hypothesisId: "A",
      },
      timestamp: Date.now(),
      hypothesisId: "A",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  return requires;
}

export function readReservationLink(
  lead?: { payload?: Record<string, unknown> | null },
  payload?: Record<string, unknown>,
): string | null {
  const keys = [
    "reservation_agence_link",
    "reservation_entreprise_link",
    "reservation_cif_link",
    "reservation_comptable_link",
  ] as const;

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
