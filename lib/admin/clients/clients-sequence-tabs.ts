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
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
    },
    description: "Email post-paiement Stripe (product_payment_welcome).",
  },
  {
    id: "free-trial",
    label: "Free trial",
    resolveSlug: () => "free-trial",
    availability: {
      agence: "empty",
      comptable: "live",
      entreprise: "empty",
      cif: "empty",
      jum: "empty",
    },
    description:
      "Nurture pré-paiement essai 14j (J+1 → J+3). Stop reply/opt-out ou checkout trial.",
  },
  {
    id: "free-trial-started",
    label: "Free trial started",
    resolveSlug: () => "free-trial-started",
    availability: {
      agence: "empty",
      comptable: "live",
      entreprise: "empty",
      cif: "empty",
      jum: "empty",
    },
    description:
      "Post-paiement essai (remplace payment-welcome pour monthly_1499_trial).",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    resolveSlug: (niche) =>
      niche === "entreprise" ? "entreprise-sold-check" : "onboarding-sequence",
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
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
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
    },
    description: "Invitation et relance siège Calendly post-onboarding agence.",
  },
  {
    id: "deliverance",
    label: "Délivrance",
    resolveSlug: () => "deliverance",
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
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
      cif: "empty",
      jum: "empty",
    },
    description: "Proposition agence à l'entreprise (match_proposal).",
  },
  {
    id: "matching-booking",
    label: "Matching RDV",
    resolveSlug: () => "matching-booking",
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
    },
    description: "Confirmation RDV agence quand l'entreprise réserve.",
  },
  {
    id: "survey",
    label: "Survey post-RDV",
    resolveSlug: () => "post-rdv-survey",
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
      jum: "live",
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
