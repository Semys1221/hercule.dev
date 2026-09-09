import { getEmailSequence } from "@/lib/admin/email-sequences/registry";
import type { Niche } from "@/lib/admin/navigation";

export type ClientsSequenceTabAvailability = "live" | "empty";

export type ClientsSequenceTabDef = {
  id: string;
  label: string;
  resolveSlug: (niche: Niche) => string;
  availability: Record<Niche, ClientsSequenceTabAvailability>;
  description?: string;
};

export const CLIENTS_SEQUENCE_TABS: ClientsSequenceTabDef[] = [
  {
    id: "payment-welcome",
    label: "Payment welcome",
    resolveSlug: () => "payment-welcome",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
    },
    description: "Email post-paiement Stripe (product_payment_welcome).",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    resolveSlug: (niche) =>
      niche === "entreprise" ? "entreprise-sold-check" : "onboarding-sequence",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "live",
    },
    description:
      "Séquence post-formulaire onboarding (agence) ou check J+7 entreprise (sold_check_j7).",
  },
  {
    id: "calendly-seat",
    label: "Calendly seat",
    resolveSlug: () => "calendly-seat-onboarding",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
    },
    description: "Invitation et relance siège Calendly post-onboarding agence.",
  },
  {
    id: "deliverance",
    label: "Délivrance",
    resolveSlug: () => "deliverance",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "live",
    },
    description: "Recherche lancée, mise à jour J+7, milestones, waitlist.",
  },
  {
    id: "matching-proposal",
    label: "Matching proposition",
    resolveSlug: () => "matching-proposal",
    availability: {
      agence: "empty",
      comptable: "empty",
      entreprise: "live",
    },
    description: "Proposition agence à l'entreprise (match_proposal).",
  },
  {
    id: "matching-booking",
    label: "Matching RDV",
    resolveSlug: () => "matching-booking",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
    },
    description: "Confirmation RDV agence quand l'entreprise réserve.",
  },
  {
    id: "survey",
    label: "Survey post-RDV",
    resolveSlug: () => "post-rdv-survey",
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "live",
    },
    description: "Survey fin de RDV avec relance +24h.",
  },
];

export function clientsSequenceTabsForNiche(niche: Niche): ClientsSequenceTabDef[] {
  return CLIENTS_SEQUENCE_TABS.filter((tab) => tab.availability[niche] === "live");
}

export function isClientsSequenceTabLive(
  tab: ClientsSequenceTabDef,
  niche: Niche,
): boolean {
  return tab.availability[niche] === "live";
}

export function resolveClientsSequenceEntry(tab: ClientsSequenceTabDef, niche: Niche) {
  const slug = tab.resolveSlug(niche);
  return getEmailSequence(slug);
}
