import { DEFAULT_BOOKING_EMAIL_TEMPLATES } from "@/lib/booking-communication/templates";
import type { BookingEmailType } from "@/lib/booking-communication/types";

import type { DeliveranceAction } from "@/lib/deliverance/orchestrator";

export type EmailRecipientScope = "agence" | "entreprise" | "both";

export type CockpitActionEmail = {
  type: BookingEmailType;
  subject: string;
  recipients: EmailRecipientScope;
};

export type CockpitActionHelp = {
  id: string;
  buttonLabel: string;
  summary: string;
  emails: {
    immediate: CockpitActionEmail[];
    scheduled?: { type: BookingEmailType; delay: string; subject: string; recipients: EmailRecipientScope }[];
  };
  uiEffects: string[];
  dbEffects?: string[];
};

function subjectFor(type: BookingEmailType): string {
  return DEFAULT_BOOKING_EMAIL_TEMPLATES[type]?.subject ?? type;
}

export const DELIVERANCE_ACTION_HELP: Record<DeliveranceAction, CockpitActionHelp> = {
  search_started: {
    id: "search_started",
    buttonLabel: "Lancer la recherche",
    summary: "Email « Recherche lancée » aux deux parties + J+7 planifié. Timeline agence : 1ère étape active.",
    emails: {
      immediate: [
        {
          type: "deliverance_search_started",
          subject: subjectFor("deliverance_search_started"),
          recipients: "both",
        },
      ],
      scheduled: [
        {
          type: "deliverance_d7_update",
          delay: "J+7",
          subject: subjectFor("deliverance_d7_update"),
          recipients: "both",
        },
      ],
    },
    uiEffects: ["Dashboard agence : première étape de la timeline → active"],
    dbEffects: ["match.search_started_at renseigné"],
  },
  milestone: {
    id: "milestone",
    buttonLabel: "Avancer l'étape",
    summary: "Email milestone aux deux parties. Timeline agence : étape suivante franchie.",
    emails: {
      immediate: [
        {
          type: "deliverance_milestone",
          subject: subjectFor("deliverance_milestone"),
          recipients: "both",
        },
      ],
    },
    uiEffects: [
      "Dashboard agence : étape pending → done, suivante → active",
    ],
  },
  waitlist: {
    id: "waitlist",
    buttonLabel: "File d'attente",
    summary: "Email file d'attente aux deux parties. Aucun changement sur la timeline.",
    emails: {
      immediate: [
        {
          type: "deliverance_waitlist",
          subject: subjectFor("deliverance_waitlist"),
          recipients: "both",
        },
      ],
    },
    uiEffects: ["Dashboard client : message d'attente uniquement (pas de timeline)"],
  },
};

export const PROPOSE_MATCH_ACTION_HELP: CockpitActionHelp = {
  id: "propose_match",
  buttonLabel: "Proposer le match",
  summary: "Email proposition à l'entreprise + relance J+1 si pas de réservation.",
  emails: {
    immediate: [
      {
        type: "match_proposal",
        subject: subjectFor("match_proposal"),
        recipients: "entreprise",
      },
    ],
    scheduled: [
      {
        type: "match_proposal_followup",
        delay: "J+1",
        subject: subjectFor("match_proposal_followup"),
        recipients: "entreprise",
      },
    ],
  },
  uiEffects: ["—"],
  dbEffects: ["Création match (proposed) + product_statut entreprise MATCH_PROPOSED"],
};

export function deliveranceActionHelp(action: DeliveranceAction): CockpitActionHelp {
  return DELIVERANCE_ACTION_HELP[action];
}
