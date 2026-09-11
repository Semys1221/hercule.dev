import {
  getEmailSequence,
  meetingSequenceSlugForNiche,
} from "@/lib/admin/email-sequences/registry";
import type { Niche } from "@/lib/admin/navigation";

export type BookingsSequenceTabAvailability = "live" | "empty";

export type BookingsSequenceTabDef = {
  id: string;
  label: string;
  resolveSlug: (niche: Niche) => string;
  needsCampaign: boolean;
  availability: Record<Niche, BookingsSequenceTabAvailability>;
  description?: string;
};

export const BOOKINGS_SEQUENCE_TABS: BookingsSequenceTabDef[] = [
  {
    id: "subsequence",
    label: "E1 → E3",
    resolveSlug: () => "subsequence-interested",
    needsCampaign: true,
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
    },
    description: "Subsequence interested post-webhook Instantly.",
  },
  {
    id: "reply",
    label: "Reply agent",
    resolveSlug: () => "reply-agent",
    needsCampaign: true,
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
    },
    description: "Prompt IA par campagne Instantly.",
  },
  {
    id: "confirm",
    label: "Confirmation",
    resolveSlug: (niche) => meetingSequenceSlugForNiche(niche),
    needsCampaign: false,
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
    },
    description:
      "Emails de confirmation Calendly (Resend). Déclenchés depuis le pipeline via « Confirmer ».",
  },
  {
    id: "reminders",
    label: "Reminders",
    resolveSlug: () => "role-recovery",
    needsCampaign: false,
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
      cif: "empty",
    },
    description: "Récupération rôle agence (role_seq_48 / role_seq_24).",
  },
  {
    id: "no-show",
    label: "No-show",
    resolveSlug: () => "no-show",
    needsCampaign: true,
    availability: {
      agence: "live",
      comptable: "live",
      entreprise: "live",
      cif: "live",
    },
    description: "Séquence absence pre-meeting (Instantly bypass).",
  },
  {
    id: "absent",
    label: "Absent",
    resolveSlug: () => "sales-call-no-show",
    needsCampaign: false,
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
      cif: "empty",
    },
    description: "Séquence post-call no-show (Resend).",
  },
  {
    id: "not-paid",
    label: "Non payé",
    resolveSlug: () => "close-indecis",
    needsCampaign: false,
    availability: {
      agence: "live",
      comptable: "empty",
      entreprise: "empty",
      cif: "empty",
    },
    description: "Séquence client indécis non payé (Resend).",
  },
];

export function bookingsSequenceTabsForNiche(niche: Niche): BookingsSequenceTabDef[] {
  return BOOKINGS_SEQUENCE_TABS.filter((tab) => tab.availability[niche] === "live");
}

export function isBookingsSequenceTabLive(
  tab: BookingsSequenceTabDef,
  niche: Niche,
): boolean {
  return tab.availability[niche] === "live";
}

export function resolveBookingsSequenceEntry(tab: BookingsSequenceTabDef, niche: Niche) {
  const slug = tab.resolveSlug(niche);
  return getEmailSequence(slug);
}
