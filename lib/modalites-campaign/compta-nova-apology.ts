import { finalizeRenderedEmail } from "@/lib/booking-communication/signatures";
import {
  buildFirstNameLine,
} from "@/lib/booking-communication/templates";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

export const COMPTA_NOVA_APOLOGY_EMAIL = "contact@compta-nova.fr";
export const COMPTA_NOVA_APOLOGY_IDEMPOTENCY_KEY =
  "compta-nova/modalites-link-fixed-apology";
export const COMPTA_NOVA_APOLOGY_SUBJECT =
  "Merci pour votre retour — votre rendez-vous est validé";

export function comptaNovaApologyBody(lead: LinkTrackingLead): string {
  const firstNameLine = buildFirstNameLine(lead.first_name, "h24_relance");

  return `${firstNameLine}

Merci pour votre retour. Votre lien a été corrigé et votre rendez-vous est enregistré.

Aucune action n'est requise de votre part. Vous recevrez les informations de connexion via Calendly.`;
}

export async function renderComptaNovaApologyEmail(lead: LinkTrackingLead) {
  return finalizeRenderedEmail({
    category: "entreprise",
    subject: COMPTA_NOVA_APOLOGY_SUBJECT,
    body: comptaNovaApologyBody(lead),
    emailType: "h24_relance",
    useHtml: true,
  });
}
